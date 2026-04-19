# NeuronGrid

**Private Local AI Cloud** - Distributed AI inference across your devices

## Quick Start

```bash
# Install globally
npm install -g neurongrid

# Start master node (with UI)
neurongrid start

# Or start worker node only
neurongrid node

# Or start in peer mode (auto-mesh)
neurongrid peer
```

## What is NeuronGrid?

Turn your devices into a private AI cloud. Run large language models distributed across multiple computers on your local network.

## Features

- 🚀 Distributed AI inference
- 🔒 100% private and local
- 🌐 Auto-discovery on LAN
- 💻 Web UI dashboard
- 🎯 Load balancing
- 📊 Real-time monitoring

## Requirements

- Node.js 18+
- Python 3.9+
- Windows, macOS, or Linux

## Usage

### Master Node (Orchestrator + UI + Worker)
```bash
neurongrid start
```
Access UI at: http://localhost:3000

### Worker Node (Auto-discovers Master)
```bash
neurongrid node
```

### Peer Mode (Mesh Network)
```bash
neurongrid peer
```

## Architecture

- **Orchestrator**: Manages cluster and distributes workload
- **Model Manager**: Handles AI model deployment
- **Device Service**: Reports hardware capabilities
- **Model Runner**: Executes AI inference
- **Web UI**: Dashboard for monitoring and control

## License

MIT

## Author

Nilabh
