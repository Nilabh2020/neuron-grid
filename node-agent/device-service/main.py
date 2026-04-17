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
ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:8000")
NODE_ID = str(uuid.UUID(int=uuid.getnode()))
HEARTBEAT_INTERVAL = 10 # seconds

app = FastAPI(title=f"NeuronGrid Node Agent ({NODE_ID})")

class HardwareStats:
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
            "gpu_usage": [] # Placeholder for future GPU support
        }

def register_with_orchestrator():
    stats = HardwareStats.get_stats()
    registration_data = {
        "node_id": NODE_ID,
        "hostname": stats["hostname"],
        "ip_address": stats["ip_address"],
        "os": stats["os"],
        "cpu_cores": stats["cpu_cores"],
        "ram_gb": stats["ram_gb"],
        "gpu_info": []
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
            
            logger.debug(f"Heartbeat sent to {ORCHESTRATOR_URL}")
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}")
        
        time.sleep(HEARTBEAT_INTERVAL)

@app.on_event("startup")
async def startup_event():
    # Attempt registration on startup
    if register_with_orchestrator():
        # Start heartbeat in a separate thread
        thread = threading.Thread(target=heartbeat_loop, daemon=True)
        thread.start()
    else:
        logger.warning("Initial registration failed. Node will attempt to re-register in heartbeat loop.")
        thread = threading.Thread(target=heartbeat_loop, daemon=True)
        thread.start()

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
