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
                    gpus.append({"name": name.strip(), "vram_mb": int(vram.strip().split()[0])})
            return gpus
        except Exception:
            # For testing/demo on non-NVIDIA machines, return a simulated GPU based on port
            # so we can show heterogeneous compute in the cluster
            port = int(os.getenv("NODE_AGENT_PORT", 8001))
            if port == 8001:
                return [{"name": "NVIDIA RTX 5060 Ti", "vram_mb": 16384, "compute_score": 100}]
            else:
                return [{"name": "NVIDIA RTX 3050 Ti", "vram_mb": 4096, "compute_score": 30}]

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
    while True:
        try:
            data, addr = udp_socket.recvfrom(1024)
            msg = data.decode('utf-8')
            if msg.startswith("NEURON_ORCHESTRATOR:"):
                discovered_url = msg.split("NEURON_ORCHESTRATOR:")[1]
                if ORCHESTRATOR_URL != discovered_url:
                    logger.info(f"Discovered Orchestrator at {discovered_url}")
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
