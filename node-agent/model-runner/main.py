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
MODELS_DIR = os.getenv("MODELS_DIR", "./models")
BIN_DIR = os.path.join(os.getcwd(), "bin")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(BIN_DIR, exist_ok=True)

# State
rpc_process = None
master_process = None

def get_binary_info():
    """Detects the current OS and CPU architecture to fetch the correct llama.cpp binary."""
    system = platform.system().lower()
    machine = platform.machine().lower()
    base_url = "https://github.com/ggerganov/llama.cpp/releases/download/b2640/"
    
    if system == "windows":
        return base_url + "llama-b2640-bin-win-avx2-x64.zip", ".exe"
    elif system == "darwin": # macOS and iOS devices running desktop binaries
        if "arm" in machine or "aarch64" in machine:
            return base_url + "llama-b2640-bin-macos-arm64.zip", ""
        else:
            return base_url + "llama-b2640-bin-macos-x64.zip", ""
    else: # Linux and others
        return base_url + "llama-b2640-bin-ubuntu-x64.zip", ""

def ensure_binaries():
    """Downloads llama.cpp binaries if they don't exist based on OS."""
    url, ext = get_binary_info()
    llama_server = os.path.join(BIN_DIR, f"llama-server{ext}")
    llama_rpc = os.path.join(BIN_DIR, f"llama-rpc-server{ext}")
    
    if os.path.exists(llama_server) and os.path.exists(llama_rpc):
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
            os.chmod(llama_rpc, os.stat(llama_rpc).st_mode | stat.S_IEXEC)
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
    rpc_exe = os.path.join(BIN_DIR, f"llama-rpc-server{ext}")
    
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
    body = await req.json()
    
    filename = body.get("model_name")
    rpc_servers = body.get("rpc_servers", "")
    filepath = os.path.join(MODELS_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Model {filename} not found.")
        
    _, ext = get_binary_info()
    server_exe = os.path.join(BIN_DIR, f"llama-server{ext}")
    
    if master_process:
        master_process.terminate()
        master_process.wait()
        
    cmd = [
        server_exe,
        "-m", filepath,
        "--port", "8080",
        "-c", "2048",
        "--host", "127.0.0.1"
    ]
    
    if rpc_servers:
        cmd.extend(["--rpc", rpc_servers])
        logger.info(f"Master Node: Offloading layers to {rpc_servers}")
    else:
        logger.info("Master Node: Running locally (No RPC workers provided)")
        
    master_process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    time.sleep(3) 
    
    try:
        openai_req = {
            "messages": body.get("messages"),
            "max_tokens": body.get("max_tokens", 512),
            "temperature": body.get("temperature", 0.7),
            "stream": body.get("stream", False)
        }
        
        if openai_req["stream"]:
            response = requests.post("http://127.0.0.1:8080/v1/chat/completions", json=openai_req, stream=True)
            return StreamingResponse(response.iter_lines(), media_type="text/event-stream")
        else:
            response = requests.post("http://127.0.0.1:8080/v1/chat/completions", json=openai_req)
            return response.json()
            
    except Exception as e:
        logger.error(f"Failed to proxy to Master Server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MODEL_RUNNER_PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
