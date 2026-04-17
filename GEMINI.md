# NeuronGrid: Private Local AI Cloud

## Project Architecture
- **cluster-core**: Centralized services for the AI cluster.
  - **orchestrator**: Node discovery, cluster state, job scheduling, OpenAI-compatible API.
  - **scheduler**: Logic for routing jobs.
  - **model-manager**: HuggingFace GGUF downloads and metadata.
- **node-agent**: Local service running on each compute node.
  - **device-service**: Hardware monitoring, registration.
  - **model-runner**: llama.cpp inference engine.
- **web-ui**: User interface.
  - **frontend**: Next.js, Tailwind, shadcn/ui.
  - **backend**: Node.js API layer.

## Phase 2 MVP Progress
- [x] Model Manager Service (HuggingFace integration)
- [ ] Remote Inference System (llama.cpp)
- [ ] OpenAI Compatible API

## Tech Stack
- Python (FastAPI, WebSockets)
- llama.cpp
- SQLite (State management)
- Redis (Optional, queueing)
- Next.js (Dashboard)

## Development Decisions
- Use `pydantic` for registration schemas.
- Use `psutil` for hardware monitoring in Node Agent.
- Orchestrator to store node status in SQLite.
