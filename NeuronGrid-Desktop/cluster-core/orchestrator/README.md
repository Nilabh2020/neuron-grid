# Cluster Orchestrator

The central brain of NeuronGrid. 

Responsible for:
- Discovering and registering nodes in the AI cluster.
- Monitoring node health (heartbeats).
- Exposing the primary cluster API.
- Routing inference jobs to available nodes (future phase).
- Providing an OpenAI-compatible API (future phase).

## Tech Stack
- Python
- FastAPI
- SQLite (for cluster state persistence)

## Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and configure.
5. Run: `python main.py`

## Endpoints
- `GET /nodes`: List all registered nodes and their current status.
- `POST /register`: Endpoint for nodes to register hardware specs.
- `POST /heartbeat`: Endpoint for nodes to send live metrics.
