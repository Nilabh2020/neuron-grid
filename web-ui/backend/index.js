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

// Proxy Chat Completions (Direct to Orchestrator)
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
