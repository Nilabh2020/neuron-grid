# 🧠 NeuronGrid

### The Private Local AI Cloud for the Modern Enterprise

[![License](https://img.shields.io/badge/license-Commercial-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

**NeuronGrid** transforms your local hardware—from Raspberry Pis to high-end GPU servers—into a unified, private AI compute cluster. Run large language models (LLMs) locally with the ease of Docker and the power of Kubernetes, all while keeping your data strictly within your network.

---

## 🚀 Key Features

- **🌐 Automatic Node Discovery:** Seamlessly join new devices to your cluster via LAN broadcast.
- **🛠️ Unified Compute Pool:** Combine heterogeneous hardware (CPU, RAM, GPU) into a single logical AI resource.
- **📦 Model Management:** Direct integration with HuggingFace for GGUF model downloads and distribution.
- **🔌 OpenAI Compatible:** Drop-in replacement for OpenAI API (`v1/chat/completions`).
- **🖥️ Minimalist Dashboard:** Modern Web-UI for monitoring cluster health, model deployments, and live chat.

---

## 🏗️ Architecture

NeuronGrid is built with a modular, distributed architecture designed for scalability and low latency.

```mermaid
graph TD
    User([User / Developer]) -->|OpenAI API| O[Cluster Orchestrator]
    O -->|Schedule| S[Scheduler]
    O -->|Manage| MM[Model Manager]
    O <-->|Registration & Heartbeat| NA1[Node Agent A]
    O <-->|Registration & Heartbeat| NA2[Node Agent B]
    NA1 -->|Inference| LR1[llama.cpp Runner]
    NA2 -->|Inference| LR2[llama.cpp Runner]
    W[Web UI Dashboard] <-->|Control| O
```

### Core Components:
- **`cluster-core/`**: The "brain" of the operation. Handles state, scheduling, and API routing.
- **`node-agent/`**: The "muscle". Runs on every device to report hardware stats and execute LLM jobs.
- **`web-ui/`**: The "face". A sleek Electron/Next.js desktop application for management.

---

## 🛠️ Quick Start (MVP Phase 1)

### 1. Start the Orchestrator
```bash
cd cluster-core/orchestrator
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 2. Start a Node Agent
```bash
cd node-agent/device-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## 🤝 Contributors

- **Nilabh** (@Nilabh2020) - Lead Engineer & Founder
- **Gemini CLI** - AI Co-founder & Core Architect

---

## 📜 License

**Commercial / Closed Source**
Copyright © 2026 NeuronGrid. All rights reserved.

---

*“Your hardware. Your data. Your AI Cloud.”*
