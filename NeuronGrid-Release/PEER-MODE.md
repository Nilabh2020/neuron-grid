# 🌐 NeuronGrid Peer Mode - Mesh Cluster

## What is Peer Mode?

**Peer Mode** turns every device into a full NeuronGrid node that can act as BOTH master and worker. No dedicated roles needed!

### Traditional Mode vs Peer Mode

**Traditional (Master/Worker):**
```
Master PC:  Orchestrator + UI + Worker
Worker PC:  Worker only (no UI)
```

**Peer Mode (Mesh):**
```
PC:         Orchestrator + UI + Worker
Laptop:     Orchestrator + UI + Worker  
Raspberry:  Orchestrator + UI + Worker
```

Every device is equal! 🎉

---

## 🚀 Quick Start

### On EVERY Device (PC, Laptop, Raspberry Pi, etc.):

**Windows:**
```bash
# Just double-click:
Start-Peer.bat

# Or run:
node cli.js peer
```

**Linux/Mac:**
```bash
node cli.js peer
```

That's it! Each device will:
- ✅ Run its own orchestrator
- ✅ Run its own UI (http://localhost:3000)
- ✅ Contribute compute as worker
- ✅ Auto-discover other peers on LAN
- ✅ Share models and workload

---

## 🎯 How It Works

### Auto-Discovery
1. Each peer broadcasts: "I'm an orchestrator!"
2. Each peer listens: "Who else is an orchestrator?"
3. Workers connect to the **first** orchestrator they find
4. If that's their own local orchestrator, they use it
5. Otherwise, they join a remote orchestrator

### Smart Routing
- **Local orchestrator available?** → Use it (you're the master)
- **Remote orchestrator found?** → Join it (you're a worker)
- **Multiple orchestrators?** → Workers distribute automatically

### Model Sharing
- Models stored in `~/.neurongrid/models/` on each device
- Download once, use everywhere
- Orchestrator routes jobs to nodes with the model

---

## 📱 Usage Scenarios

### Scenario 1: Using Your PC
```bash
# On PC
Start-Peer.bat

# Open browser: http://localhost:3000
# Use the UI, chat with models
# PC is master, laptop/pi join as workers
```

### Scenario 2: Using Your Laptop
```bash
# On Laptop
Start-Peer.bat

# Open browser: http://localhost:3000
# Use the UI, chat with models
# Laptop is master, PC/pi join as workers
```

### Scenario 3: Using Raspberry Pi
```bash
# On Raspberry Pi
node cli.js peer

# Open browser: http://localhost:3000
# Use the UI, chat with models
# Pi is master, PC/laptop join as workers
```

**The first device you open the UI on becomes the master!**

---

## 🔄 Dynamic Master Election

What happens if the master goes offline?

1. Workers detect master is gone (heartbeat timeout)
2. Workers switch to their own local orchestrator
3. First worker to open UI becomes new master
4. Other workers auto-discover and join

**No manual intervention needed!**

---

## 💾 Model Storage

Each peer stores models locally:
```
~/.neurongrid/models/
├── gemma-4-26b-it-Q4_K_M.gguf
├── qwen-3.6-35b-Q5_K_M.gguf
└── ...
```

**Benefits:**
- Download once per device
- No network transfer during inference
- Works offline
- Faster loading

**Sharing:**
- Models are NOT automatically synced
- Download models on each device you want to use them
- Or use the UI to download on any peer

---

## 🌐 Network Requirements

**Same LAN:**
- All peers must be on same WiFi/network
- UDP port 8888 for discovery
- TCP ports: 8000, 8001, 8002, 8003

**Firewall:**
- Allow Python and Node.js
- Allow UDP broadcast on port 8888

---

## 🎮 Commands

```bash
# Start in peer mode (recommended)
node cli.js peer

# Start as dedicated master (old way)
node cli.js start

# Start as dedicated worker (old way)
node cli.js node
```

---

## 🔍 Troubleshooting

### "No nodes showing in dashboard"
- Check all devices are on same network
- Check firewall allows UDP port 8888
- Wait 10 seconds for discovery

### "Can't access UI on laptop"
- Make sure you ran `node cli.js peer` (not `node`)
- Check http://localhost:3000 (not 192.168.x.x)
- Wait for services to start (~30 seconds)

### "Models not found"
- Download models on each device separately
- Or copy `~/.neurongrid/models/` folder between devices

### "Multiple orchestrators fighting"
- This is normal! Workers will pick one
- The one you use the UI on becomes "active master"
- Others become backup masters

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your LAN Network                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   PC (Peer)  │  │ Laptop(Peer) │  │  Pi (Peer)   │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ Orchestrator │  │ Orchestrator │  │ Orchestrator │ │
│  │ Model Mgr    │  │ Model Mgr    │  │ Model Mgr    │ │
│  │ Worker       │  │ Worker       │  │ Worker       │ │
│  │ UI           │  │ UI           │  │ UI           │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ▲                 ▲                 ▲          │
│         └─────────────────┴─────────────────┘          │
│              UDP Broadcast Discovery                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Best Practices

1. **Start all peers at once** - Faster discovery
2. **Use the device you're on** - Open UI locally
3. **Download models once** - Then copy to other devices
4. **Keep peers running** - Better for auto-discovery
5. **Use same NeuronGrid version** - Avoid compatibility issues

---

## 🚀 Getting Started

**Step 1:** Clone/copy NeuronGrid to all devices

**Step 2:** On each device, run:
```bash
Start-Peer.bat  # Windows
# or
node cli.js peer  # Linux/Mac
```

**Step 3:** Open UI on the device you're using:
```
http://localhost:3000
```

**Step 4:** Check "Cluster Overview" - see all peers!

**Step 5:** Download models and start chatting!

---

**NeuronGrid Peer Mode** - Your Hardware. Your Data. Your AI Cloud. Anywhere. 🌐
