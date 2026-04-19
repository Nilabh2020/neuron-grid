import os
import time
import json
import logging
import requests
import aiofiles
import subprocess
import zipfile
import threading
import platform
import stat
import signal
import atexit
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
import urllib.request

# Load env vars
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model-runner")

app = FastAPI(title="NeuronGrid Model Runner (Distributed)")

# Storage paths
MODELS_DIR = os.getenv("MODELS_DIR", os.path.join(os.path.expanduser("~"), ".neurongrid", "models"))
BIN_DIR = os.path.join(os.getcwd(), "bin")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(BIN_DIR, exist_ok=True)

# State
rpc_process = None
master_process = None
current_model_path = None

# Cleanup function
def cleanup_processes():
    global rpc_process, master_process
    logger.info("Cleaning up processes...")
    
    if master_process:
        try:
            master_process.terminate()
            master_process.wait(timeout=3)
        except:
            try:
                master_process.kill()
            except:
                pass
    
    if rpc_process:
        try:
            rpc_process.terminate()
            rpc_process.wait(timeout=3)
        except:
            try:
                rpc_process.kill()
            except:
                pass

# Register cleanup
atexit.register(cleanup_processes)

def signal_handler(signum, frame):
    logger.info(f"Received signal {signum}, shutting down...")
    cleanup_processes()
    exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def get_binary_info():
    """Detects the current OS and CPU architecture to fetch the correct llama.cpp binary."""
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    if system == "windows":
        # Upgraded to b8838 Vulkan to support Qwen2/Gemma2 architectures AND utilize GPU VRAM out of the box
        base_url = "https://github.com/ggerganov/llama.cpp/releases/download/b8838/"
        return base_url + "llama-b8838-bin-win-vulkan-x64.zip", ".exe"
    else:
        # Legacy b3600 for macOS/Linux to maintain .zip extraction compatibility
        base_url = "https://github.com/ggerganov/llama.cpp/releases/download/b3600/"
        if system == "darwin": # macOS and iOS devices running desktop binaries
            if "arm" in machine or "aarch64" in machine:
                return base_url + "llama-b3600-bin-macos-arm64.zip", ""
            else:
                return base_url + "llama-b3600-bin-macos-x64.zip", ""
        else: # Linux and others
            return base_url + "llama-b3600-bin-ubuntu-x64.zip", ""

def ensure_binaries():
    """Downloads llama.cpp binaries if they don't exist based on OS."""
    url, ext = get_binary_info()
    llama_server = os.path.join(BIN_DIR, f"llama-server{ext}")
    
    if os.path.exists(llama_server):
        return
        
    logger.info(f"Downloading llama.cpp binaries for {platform.system()} ({platform.machine()})...")
    zip_path = os.path.join(BIN_DIR, "llama.zip")
    
    try:
        urllib.request.urlretrieve(url, zip_path)
    except Exception as e:
        logger.error(f"Failed to download binaries: {e}")
        return
        
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(BIN_DIR)
        
    os.remove(zip_path)
    
    # Make binaries executable on Unix/Linux/macOS systems
    if ext == "":
        try:
            os.chmod(llama_server, os.stat(llama_server).st_mode | stat.S_IEXEC)
            rpc_exe_old = os.path.join(BIN_DIR, "llama-rpc-server")
            rpc_exe_new = os.path.join(BIN_DIR, "rpc-server")
            if os.path.exists(rpc_exe_old): os.chmod(rpc_exe_old, os.stat(rpc_exe_old).st_mode | stat.S_IEXEC)
            if os.path.exists(rpc_exe_new): os.chmod(rpc_exe_new, os.stat(rpc_exe_new).st_mode | stat.S_IEXEC)
        except Exception as e:
            logger.warning(f"Could not automatically set executable permissions: {e}")
            
    logger.info("Binaries ready.")

class ChatCompletionRequest(BaseModel):
    model_name: str
    messages: List[dict]
    max_tokens: int = 512
    temperature: float = 0.7
    stream: bool = True
    rpc_servers: str = ""

class DownloadRequest(BaseModel):
    model_id: str
    download_url: str

@app.on_event("startup")
async def startup_event():
    # Run binary check in background
    threading.Thread(target=ensure_binaries, daemon=True).start()

@app.get("/")
async def root():
    return {"status": "Model Runner Online (Distributed Mode)"}

@app.post("/download")
async def download_model(req: DownloadRequest):
    """Download a GGUF model file."""
    filename = req.download_url.split("/")[-1]
    filepath = os.path.join(MODELS_DIR, filename)
    
    if os.path.exists(filepath):
        return {"message": "Model already exists", "path": filepath}
    
    logger.info(f"Downloading model {req.model_id} from {req.download_url}")
    
    try:
        response = requests.get(req.download_url, stream=True)
        response.raise_for_status()
        
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return {"message": "Download complete", "path": filepath}
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rpc/start")
async def start_rpc_server():
    """Start the llama-rpc-server to act as a worker node."""
    global rpc_process
    
    if rpc_process and rpc_process.poll() is None:
        return {"status": "RPC server already running on port 50052"}
        
    _, ext = get_binary_info()
    rpc_exe_old = os.path.join(BIN_DIR, f"llama-rpc-server{ext}")
    rpc_exe_new = os.path.join(BIN_DIR, f"rpc-server{ext}")
    rpc_exe = rpc_exe_new if os.path.exists(rpc_exe_new) else rpc_exe_old
    
    if not os.path.exists(rpc_exe):
        raise HTTPException(status_code=503, detail="Binaries not ready yet. Please wait.")
        
    logger.info("Starting llama.cpp RPC Worker Server...")
    
    cmd = [rpc_exe, "-H", "0.0.0.0", "-p", "50052"]
    rpc_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    return {"status": "RPC Server started on port 50052"}

@app.post("/completions")
async def create_completion(req: Request):
    """Act as the Master Node: Launch llama-server with RPC and proxy the request."""
    global master_process
    global current_model_path
    
    try:
        body = await req.json()
    except Exception as e:
        logger.error(f"Failed to parse request body: {e}")
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    filename = body.get("model_name")
    if not filename:
        raise HTTPException(status_code=400, detail="model_name is required")
        
    rpc_servers = body.get("rpc_servers", "")
    filepath = os.path.join(MODELS_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Model {filename} not found.")
        
    _, ext = get_binary_info()
    server_exe = os.path.join(BIN_DIR, f"llama-server{ext}")
    
    if not os.path.exists(server_exe):
        raise HTTPException(status_code=503, detail="llama-server binary not found. Please wait for download to complete.")
    
    if master_process and current_model_path != filepath:
        logger.info(f"Switching models from {current_model_path} to {filepath}")
        try:
            master_process.terminate()
            master_process.wait(timeout=5)
        except:
            master_process.kill()
        master_process = None
        
    if not master_process or master_process.poll() is not None:
        cmd = [
            server_exe,
            "-m", filepath,
            "--port", "8080",
            "-c", "32768",
            "--host", "127.0.0.1",
            "-ngl", "999"  # Offload all layers to GPU if available
        ]
        
        if rpc_servers:
            cmd.extend(["--rpc", rpc_servers])
            logger.info(f"Master Node: Offloading layers to {rpc_servers}")
        else:
            logger.info("Master Node: Running locally (No RPC workers provided)")
            
        log_file = open("llama_server.log", "w")
        
        try:
            master_process = subprocess.Popen(cmd, stdout=log_file, stderr=log_file)
        except Exception as e:
            logger.error(f"Failed to start llama-server: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to start AI engine: {str(e)}")
            
        current_model_path = filepath
        
        logger.info("Waiting for llama-server to initialize model weights (polling health)...")
        
        # Smart Polling: Wait up to 60 seconds for the model to load
        start_time = time.time()
        is_ready = False
        while time.time() - start_time < 60:
            if master_process.poll() is not None:
                # The process crashed! Read the log to find out why.
                try:
                    with open("llama_server.log", "r") as f:
                        log_content = f.read()
                        # Extract the error line
                        error_lines = [line for line in log_content.split('\n') if 'error' in line.lower() or 'err' in line.lower()]
                        crash_reason = error_lines[-1] if error_lines else "Unknown crash reason."
                except:
                    crash_reason = "Could not read llama_server.log"
                logger.error(f"llama-server crashed during boot: {crash_reason}")
                raise HTTPException(status_code=500, detail=f"AI Engine crashed: {crash_reason}")
                
            try:
                health_check = requests.get("http://127.0.0.1:8080/health", timeout=1)
                if health_check.status_code == 200:
                    is_ready = True
                    break
            except:
                pass
            time.sleep(1)
            
        if not is_ready:
            logger.error("llama-server failed to start within 60 seconds")
            if master_process:
                try:
                    master_process.terminate()
                except:
                    pass
            raise HTTPException(status_code=504, detail="AI engine timed out while loading weights.")

    try:
        openai_req = {
            "messages": body.get("messages"),
            "max_tokens": body.get("max_tokens", 512),
            "temperature": body.get("temperature", 0.7),
            "stream": body.get("stream", False)
        }

        if openai_req["stream"]:
            openai_req["stream_options"] = {"include_usage": True}

        logger.info("Proxying request to internal llama-server on port 8080")        
        if openai_req["stream"]:
            response = requests.post("http://127.0.0.1:8080/v1/chat/completions", json=openai_req, stream=True, timeout=120)
            def stream_gen():
                for chunk in response.iter_content(chunk_size=None):
                    if chunk:
                        yield chunk
            return StreamingResponse(stream_gen(), media_type="text/event-stream")
        else:
            response = requests.post("http://127.0.0.1:8080/v1/chat/completions", json=openai_req, timeout=120)
            return response.json()
            
    except requests.exceptions.Timeout:
        logger.error("Request to llama-server timed out")
        raise HTTPException(status_code=504, detail="AI inference timed out")
    except Exception as e:
        logger.error(f"Failed to proxy to Master Server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    """Fetch the real hardware configuration and context size from the active llama-server."""
    try:
        res = requests.get("http://127.0.0.1:8080/props", timeout=5)
        if res.status_code == 200:
            data = res.json()
            return {
                "n_ctx": data.get("default_generation_settings", {}).get("n_ctx", 32768),
                "model": data.get("default_generation_settings", {}).get("model", "unknown")
            }
    except:
        pass
    return {"n_ctx": 32768, "model": current_model_path}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MODEL_RUNNER_PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
