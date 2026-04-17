from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator")

app = FastAPI(title="NeuronGrid Orchestrator")

# In-memory storage for MVP (will move to SQLite later)
nodes: Dict[str, dict] = {}

class NodeInfo(BaseModel):
    node_id: str
    hostname: str
    ip_address: str
    os: str
    cpu_cores: int
    ram_gb: float
    gpu_info: Optional[List[dict]] = None
    status: str = "online"

class Heartbeat(BaseModel):
    node_id: str
    cpu_usage: float
    ram_usage: float
    gpu_usage: Optional[List[dict]] = None

@app.get("/")
async def root():
    return {"status": "NeuronGrid Orchestrator Running", "nodes_connected": len(nodes)}

@app.post("/register")
async def register_node(node: NodeInfo):
    logger.info(f"Registering node: {node.node_id} ({node.hostname})")
    nodes[node.node_id] = node.dict()
    nodes[node.node_id]["last_seen"] = time.time()
    return {"message": "Node registered successfully", "node_id": node.node_id}

@app.post("/heartbeat")
async def receive_heartbeat(heartbeat: Heartbeat):
    if heartbeat.node_id not in nodes:
        raise HTTPException(status_code=404, detail="Node not registered")
    
    logger.debug(f"Heartbeat from {heartbeat.node_id}")
    nodes[heartbeat.node_id]["last_seen"] = time.time()
    nodes[heartbeat.node_id]["stats"] = heartbeat.dict()
    nodes[heartbeat.node_id]["status"] = "online"
    return {"status": "ok"}

@app.get("/nodes")
async def list_nodes():
    current_time = time.time()
    active_nodes = []
    
    for node_id, data in nodes.items():
        # Mark as offline if no heartbeat for 30 seconds
        if current_time - data.get("last_seen", 0) > 30:
            data["status"] = "offline"
        active_nodes.append(data)
        
    return active_nodes

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
