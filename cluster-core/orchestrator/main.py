from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time
import logging
import socket
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestrator")

app = FastAPI(title="NeuronGrid Orchestrator")

def broadcast_presence():
    udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    
    # Get local IP
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
        
    message = f"NEURON_ORCHESTRATOR:http://{local_ip}:8000".encode('utf-8')
    
    while True:
        try:
            udp_socket.sendto(message, ('<broadcast>', 8888))
        except Exception:
            pass
        time.sleep(5)

@app.on_event("startup")
async def startup_event():
    threading.Thread(target=broadcast_presence, daemon=True).start()
    logger.info("Started UDP discovery broadcast on port 8888")

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
        if current_time - data.get("last_seen", 0) > 30:
            data["status"] = "offline"
        active_nodes.append(data)
    return active_nodes

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[dict]
    stream: bool = False
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest):
    """OpenAI-compatible API routing with Distributed LAN Offloading."""
    current_time = time.time()
    active_nodes = []
    
    for node_id, data in nodes.items():
        if current_time - data.get("last_seen", 0) < 30 and data.get("status") == "online":
            active_nodes.append(data)
            
    if not active_nodes:
        raise HTTPException(status_code=503, detail="No active nodes available in cluster")

    # --- Heterogeneous Compute Profiling ---
    for node in active_nodes:
        # Calculate a compute score based on GPU VRAM, falling back to RAM
        score = 0
        gpus = node.get("gpu_info", [])
        if gpus:
            for gpu in gpus:
                score += gpu.get("vram_mb", 0) * gpu.get("compute_score", 1)
        else:
            score += node.get("ram_gb", 0) * 10 # CPU/RAM is heavily penalized
        
        node["_compute_score"] = score

    # Sort nodes by the new compute score (best hardware first)
    active_nodes.sort(key=lambda x: x.get("_compute_score", 0), reverse=True)
    
    total_score = sum(n.get("_compute_score", 1) for n in active_nodes)
    
    master_node = active_nodes[0]
    worker_nodes = active_nodes[1:]
    
    # Calculate Asymmetric Sharding Profile
    sharding_profile = {}
    for n in active_nodes:
        percentage = round((n.get("_compute_score", 1) / total_score) * 100, 1)
        sharding_profile[n.get("hostname")] = f"{percentage}%"
        
    logger.info(f"--- Asymmetric Load Balancing Profile ---")
    logger.info(f"{sharding_profile}")
    
    # 1. Tell all worker nodes to start their RPC servers
    worker_ips = []
    for worker in worker_nodes:
        worker_ip = worker.get("ip_address", "localhost")
        try:
            # Tell the worker to prepare for distributed inference
            requests.post(f"http://{worker_ip}:8003/rpc/start", timeout=3)
            worker_ips.append(f"{worker_ip}:50052")
            logger.info(f"Started RPC on worker {worker_ip}")
        except Exception as e:
            logger.warning(f"Failed to start RPC on {worker_ip}: {e}")

    # 2. Route the main request to the Master Node, passing the RPC cluster info
    master_ip = master_node.get("ip_address", "localhost")
    master_url = f"http://{master_ip}:8003/completions"
    rpc_servers = ",".join(worker_ips)
    
    try:
        runner_req = {
            "model_name": req.model,
            "messages": req.messages,
            "stream": req.stream,
            "max_tokens": req.max_tokens,
            "temperature": req.temperature,
            "rpc_servers": rpc_servers # Pass the cluster pool to the master!
        }
        
        logger.info(f"Routing job to Master ({master_ip}) with Workers ({rpc_servers})")
        
        if req.stream:
            response = requests.post(master_url, json=runner_req, stream=True)
            return StreamingResponse(response.iter_lines(), media_type="text/event-stream")
        else:
            response = requests.post(master_url, json=runner_req)
            return response.json()
            
    except Exception as e:
        logger.error(f"Routing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
