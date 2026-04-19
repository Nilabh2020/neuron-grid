# Node Agent: Device Service

Responsible for:
- Collecting hardware stats (CPU, RAM, OS).
- Registering the node to the Cluster Orchestrator.
- Sending periodic heartbeats with live metrics.
- Exposing a local API for node status.

## Tech Stack
- Python
- FastAPI
- psutil

## Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and configure.
5. Run: `python main.py`
