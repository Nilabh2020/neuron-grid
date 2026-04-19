import os
import time
import uuid
import psutil
import socket
import logging
import requests
import threading
from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("node-agent")

# Constants
ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", None)
NODE_ID = str(uuid.UUID(int=uuid.getnode()))
HEARTBEAT_INTERVAL = 10 # seconds

app = FastAPI(title=f"NeuronGrid Node Agent ({NODE_ID})")

import subprocess
import re

def estimate_compute_score(gpu_name: str) -> int:
    """
    Dynamically estimates a compute multiplier based on NVIDIA GPU naming conventions.
    This allows universal support for any GPU (e.g., 2x5090, 1080 Ti, A100).
    """
    name = gpu_name.upper()
    score = 10  # Base baseline
    
    # Match standard consumer RTX/GTX patterns (e.g., "4090", "1080", "3050")
    match = re.search(r'([1-9][0-9])([5-9]0)', name)
    if match:
        gen = int(match.group(1)) # Generation (e.g., 10, 20, 30, 40, 50)
        tier = int(match.group(2)) # Tier (e.g., 50, 60, 70, 80, 90)
        
        # Newer generation = exponentially faster
        gen_mult = max(1.0, (gen / 10.0))
        # Higher tier = exponentially faster
        tier_mult = max(1.0, (tier - 40) / 10.0)
        
        score = int(gen_mult * tier_mult * 10)
        
        # Bonus for Ti / SUPER variants
        if "TI" in name or "SUPER" in name:
            score = int(score * 1.2)
            
    # Datacenter / Enterprise GPU Heuristics
    elif "H100" in name: score = 400
    elif "H200" in name: score = 500
    elif "A100" in name: score = 200
    elif "V100" in name: score = 100
    elif "A40" in name: score = 80
    elif "T4" in name: score = 30
    elif "P40" in name: score = 20
    elif "QUADRO" in name: score = 15
    
    # Penalty for mobile/laptop chips
    if " M" in name or "-M" in name:
        score = int(score * 0.7)
        
    return max(1, score)

class HardwareStats:
    @staticmethod
    def get_gpu_info():
        try:
            output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"], 
                text=True, stderr=subprocess.DEVNULL
            )
            gpus = []
            for line in output.strip().split('\n'):
                if line:
                    name, vram = line.split(',')
                    clean_name = name.strip()
                    gpus.append({
                        "name": clean_name, 
                        "vram_mb": int(vram.strip().split()[0]),
                        "compute_score": estimate_compute_score(clean_name)
                    })
            return gpus
        except Exception:
            # Simulated fallback for testing on non-NVIDIA machines
            # Still routes through our new dynamic universal scorer!
            port = int(os.getenv("NODE_AGENT_PORT", 8001))
            if port == 8001:
                return [{"name": "NVIDIA RTX 5090", "vram_mb": 32768, "compute_score": estimate_compute_score("RTX 5090")},
                        {"name": "NVIDIA RTX 5090", "vram_mb": 32768, "compute_score": estimate_compute_score("RTX 5090")}]
            else:
                return [{"name": "NVIDIA GTX 1080 Ti", "vram_mb": 11264, "compute_score": estimate_compute_score("GTX 1080 Ti")}]

    @staticmethod
    def get_stats():
        return {
            "cpu_cores": psutil.cpu_count(logical=True),
            "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "os": os.name,
            "hostname": socket.gethostname(),
            "ip_address": socket.gethostbyname(socket.gethostname())
        }
    
    @staticmethod
    def get_live_metrics():
        return {
            "cpu_usage": psutil.cpu_percent(),
            "ram_usage": psutil.virtual_memory().percent,
            "gpu_usage": [] # Placeholder for future live GPU usage
        }


def listen_for_orchestrator():
    global ORCHESTRATOR_URL
    udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # Enable port reuse and bind to 8888
    if os.name != 'nt':
        udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    udp_socket.bind(('', 8888))
    
    logger.info("Listening for Orchestrator broadcast on UDP 8888...")
    logger.info("PEER MODE: Will connect to first available orchestrator")
    
    while True:
        try:
            data, addr = udp_socket.recvfrom(1024)
            msg = data.decode('utf-8')
            if msg.startswith("NEURON_ORCHESTRATOR:"):
                discovered_url = msg.split("NEURON_ORCHESTRATOR:")[1]
                
                # In peer mode, prefer localhost orchestrator if available
                local_ip = socket.gethostbyname(socket.gethostname())
                discovered_ip = discovered_url.split("//")[1].split(":")[0]
                
                # If we discover our own orchestrator, use it
                if discovered_ip == local_ip or discovered_ip == "127.0.0.1":
                    if ORCHESTRATOR_URL != "http://localhost:8000":
                        logger.info(f"Found local orchestrator, using: http://localhost:8000")
                        ORCHESTRATOR_URL = "http://localhost:8000"
                        register_with_orchestrator()
                # Otherwise, use the first remote orchestrator we find
                elif ORCHESTRATOR_URL != discovered_url:
                    logger.info(f"Discovered remote orchestrator at {discovered_url}")
                    ORCHESTRATOR_URL = discovered_url
                    register_with_orchestrator()
        except Exception as e:
            pass

def register_with_orchestrator():
    if not ORCHESTRATOR_URL:
        return False
        
    stats = HardwareStats.get_stats()
    registration_data = {
        "node_id": NODE_ID,
        "hostname": stats["hostname"],
        "ip_address": stats["ip_address"],
        "os": stats["os"],
        "cpu_cores": stats["cpu_cores"],
        "ram_gb": stats["ram_gb"],
        "gpu_info": HardwareStats.get_gpu_info()
    }

    
    try:
        response = requests.post(f"{ORCHESTRATOR_URL}/register", json=registration_data, timeout=5)
        if response.status_code == 200:
            logger.info("Successfully registered with Orchestrator")
            return True
        else:
            logger.error(f"Failed to register: {response.text}")
    except Exception as e:
        logger.error(f"Error during registration: {e}")
    return False

def heartbeat_loop():
    logger.info("Starting heartbeat loop...")
    while True:
        if ORCHESTRATOR_URL:
            try:
                metrics = HardwareStats.get_live_metrics()
                heartbeat_data = {
                    "node_id": NODE_ID,
                    "cpu_usage": metrics["cpu_usage"],
                    "ram_usage": metrics["ram_usage"],
                    "gpu_usage": []
                }
                response = requests.post(f"{ORCHESTRATOR_URL}/heartbeat", json=heartbeat_data, timeout=5)
                if response.status_code == 404:
                    logger.warning("Orchestrator doesn't recognize node. Re-registering...")
                    register_with_orchestrator()
                
            except Exception as e:
                logger.debug(f"Failed to send heartbeat: {e}")
        
        time.sleep(HEARTBEAT_INTERVAL)

@app.on_event("startup")
async def startup_event():
    # Start LAN discovery thread
    threading.Thread(target=listen_for_orchestrator, daemon=True).start()
    # Start heartbeat thread
    threading.Thread(target=heartbeat_loop, daemon=True).start()
    
    # Attempt initial registration if URL already set in ENV
    if ORCHESTRATOR_URL:
        register_with_orchestrator()

@app.get("/")
async def status():
    return {
        "node_id": NODE_ID,
        "status": "online",
        "orchestrator_url": ORCHESTRATOR_URL,
        "hardware": HardwareStats.get_stats(),
        "metrics": HardwareStats.get_live_metrics()
    }

if __name__ == "__main__":
    import uvicorn
    # Local port for the agent itself
    port = int(os.getenv("NODE_AGENT_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
