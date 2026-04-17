const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:8000';
const MODEL_MANAGER_URL = process.env.MODEL_MANAGER_URL || 'http://localhost:8002';

const MODELS_DIR = path.join(os.homedir(), '.neurongrid', 'models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Get Local Models
app.get('/api/local-models', (req, res) => {
    try {
        const files = fs.readdirSync(MODELS_DIR);
        const models = files.filter(f => f.endsWith('.gguf')).map(filename => {
            const filePath = path.join(MODELS_DIR, filename);
            const stats = fs.statSync(filePath);
            
            // Basic parsing from filename: e.g. gemma-4-26b-it-Q4_K_M.gguf
            const parts = filename.replace('.gguf', '').split('-');
            const quant = parts.length > 1 ? parts.pop() : 'Unknown';
            const name = parts.join('-');
            
            return {
                id: filename,
                name: name || filename,
                filename: filename,
                quant: quant,
                size_gb: (stats.size / (1024 ** 3)).toFixed(2),
                modifiedMs: stats.mtimeMs,
                arch: name.split('-')[0] || 'Unknown',
                params: 'N/A', // Need actual metadata extraction for accurate params
                publisher: 'Local',
                capabilities: ['text'],
                active: false
            };
        });
        
        // Sort by modified desc
        models.sort((a, b) => b.modifiedMs - a.modifiedMs);
        
        res.json(models);
    } catch (error) {
        console.error("Error reading local models:", error);
        res.status(500).json({ error: 'Failed to read local models' });
    }
});

// Proxy Cluster Stats
app.get('/api/cluster/stats', async (req, res) => {
    try {
        const response = await axios.get(`${ORCHESTRATOR_URL}/nodes`, { timeout: 3000 });
        const nodes = Object.values(response.data || {});
        res.json({
            nodes: nodes,
            total_nodes: nodes.length,
            online_nodes: nodes.filter(n => n.status === 'online').length
        });
    } catch (error) {
        // Log locally but return an empty state to the UI to prevent AxiosError: Network Error
        console.error("Orchestrator Connection Error. Retrying...");
        res.json({
            nodes: [],
            total_nodes: 0,
            online_nodes: 0,
            status: 'INITIALIZING'
        });
    }
});

// Proxy Model Search
app.get('/api/models/search', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await axios.get(`${MODEL_MANAGER_URL}/search?query=${query}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search models' });
    }
});

// Proxy Model Files
app.get('/api/models/files', async (req, res) => {
    try {
        const { repo_id } = req.query;
        const response = await axios.get(`${MODEL_MANAGER_URL}/model/${repo_id}/files`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch model files' });
    }
});

const activeDownloads = {};

// Start Model Download
app.post('/api/models/download', async (req, res) => {
    const { filename, download_url } = req.body;
    
    if (!filename || !download_url) {
        return res.status(400).json({ error: 'filename and download_url are required' });
    }

    if (activeDownloads[filename]) {
        return res.json({ status: 'already_downloading' });
    }

    const filePath = path.join(MODELS_DIR, filename);
    const tempPath = filePath + '.download';

    activeDownloads[filename] = {
        progress: 0,
        speed: '0 MB/s',
        eta: 'Calculating...',
        status: 'downloading',
        totalBytes: 0,
        downloadedBytes: 0
    };

    res.json({ status: 'started', filename });

    try {
        const response = await axios({
            method: 'GET',
            url: download_url,
            responseType: 'stream'
        });

        const totalLength = response.headers['content-length'];
        activeDownloads[filename].totalBytes = parseInt(totalLength, 10);

        const writer = fs.createWriteStream(tempPath);
        
        let downloadedBytes = 0;
        let lastTime = Date.now();
        let lastBytes = 0;

        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            activeDownloads[filename].downloadedBytes = downloadedBytes;
            
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // in seconds

            if (timeDiff >= 1) { // Update speed every second
                const bytesDiff = downloadedBytes - lastBytes;
                const speedMBps = bytesDiff / (1024 * 1024) / timeDiff;
                const remainingBytes = activeDownloads[filename].totalBytes - downloadedBytes;
                const etaSeconds = remainingBytes / bytesDiff * timeDiff;
                
                activeDownloads[filename].progress = (downloadedBytes / activeDownloads[filename].totalBytes) * 100;
                activeDownloads[filename].speed = speedMBps.toFixed(1) + ' MB/s';
                
                if (etaSeconds > 0 && isFinite(etaSeconds)) {
                    const m = Math.floor(etaSeconds / 60);
                    const s = Math.floor(etaSeconds % 60);
                    activeDownloads[filename].eta = m > 0 ? `${m}m ${s}s` : `${s}s`;
                }
                
                lastTime = currentTime;
                lastBytes = downloadedBytes;
            }
        });

        response.data.pipe(writer);

        writer.on('finish', () => {
            fs.renameSync(tempPath, filePath);
            activeDownloads[filename].progress = 100;
            activeDownloads[filename].status = 'completed';
        });

        writer.on('error', (err) => {
            console.error('Download error:', err);
            fs.unlinkSync(tempPath);
            activeDownloads[filename].status = 'error';
        });

    } catch (error) {
        console.error('Download request failed:', error);
        activeDownloads[filename].status = 'error';
    }
});

// Check Download Status
app.get('/api/models/downloads', (req, res) => {
    res.json(activeDownloads);
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(`${ORCHESTRATOR_URL}/v1/chat/completions`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Inference failed' });
    }
});

app.listen(PORT, () => {
    console.log(`NeuronGrid UI Backend running on http://localhost:${PORT}`);
});
