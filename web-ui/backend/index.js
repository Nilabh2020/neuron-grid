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
const CHATS_DIR = path.join(os.homedir(), '.neurongrid', 'chats');

// Ensure models and chats directories exist
if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
}
if (!fs.existsSync(CHATS_DIR)) {
    fs.mkdirSync(CHATS_DIR, { recursive: true });
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

// Save Chat
app.post('/api/chats/save', (req, res) => {
    try {
        const { chatId, messages, title } = req.body;
        
        if (!chatId || !messages) {
            return res.status(400).json({ error: 'chatId and messages are required' });
        }

        const chatFile = path.join(CHATS_DIR, `${chatId}.json`);
        const chatData = {
            id: chatId,
            title: title || 'New Conversation',
            messages: messages,
            updatedAt: Date.now()
        };

        fs.writeFileSync(chatFile, JSON.stringify(chatData, null, 2));
        res.json({ status: 'saved', chatId });
    } catch (error) {
        console.error('Failed to save chat:', error);
        res.status(500).json({ error: 'Failed to save chat' });
    }
});

// Get All Chats
app.get('/api/chats', (req, res) => {
    try {
        const files = fs.readdirSync(CHATS_DIR);
        const chats = files
            .filter(f => f.endsWith('.json'))
            .map(filename => {
                const filePath = path.join(CHATS_DIR, filename);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    id: data.id,
                    title: data.title,
                    updatedAt: data.updatedAt
                };
            })
            .sort((a, b) => b.updatedAt - a.updatedAt);

        res.json(chats);
    } catch (error) {
        console.error('Failed to load chats:', error);
        res.json([]);
    }
});

// Get Single Chat
app.get('/api/chats/:chatId', (req, res) => {
    try {
        const { chatId } = req.params;
        const chatFile = path.join(CHATS_DIR, `${chatId}.json`);
        
        if (!fs.existsSync(chatFile)) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const data = JSON.parse(fs.readFileSync(chatFile, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Failed to load chat:', error);
        res.status(500).json({ error: 'Failed to load chat' });
    }
});

// Delete Chat
app.delete('/api/chats/:chatId', (req, res) => {
    try {
        const { chatId } = req.params;
        const chatFile = path.join(CHATS_DIR, `${chatId}.json`);
        
        if (fs.existsSync(chatFile)) {
            fs.unlinkSync(chatFile);
        }

        res.json({ status: 'deleted', chatId });
    } catch (error) {
        console.error('Failed to delete chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Proxy Chat Completions with Streaming Support
app.post('/api/chat', async (req, res) => {
    try {
        const isStream = req.body.stream !== false;

        if (isStream) {
            // Request usage stats from llama.cpp
            const requestBody = {
                ...req.body,
                stream_options: { include_usage: true }
            };

            const response = await axios({
                method: 'POST',
                url: `${ORCHESTRATOR_URL}/v1/chat/completions`,
                data: requestBody,
                responseType: 'stream'
            });

            // Set headers for SSE (Server-Sent Events)
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Parse and enhance the stream with real metrics
            let buffer = '';
            response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const data = line.trim().slice(6);
                        if (data === '[DONE]') {
                            res.write(`data: [DONE]\n\n`);
                            continue;
                        }

                        try {
                            const json = JSON.parse(data);
                            
                            // If this chunk has usage stats, extract real metrics
                            if (json.usage) {
                                const usage = json.usage;
                                
                                // Calculate real metrics from llama.cpp
                                const promptTokens = usage.prompt_tokens || 0;
                                const completionTokens = usage.completion_tokens || 0;
                                const totalTokens = usage.total_tokens || 0;
                                
                                // llama.cpp can provide timing in multiple formats:
                                // 1. In usage object as nanoseconds (prompt_eval_time, eval_time)
                                // 2. In separate timings object as milliseconds (prompt_ms, predicted_ms)
                                // 3. In usage as milliseconds (prompt_time_ms, completion_time_ms)
                                
                                let promptTime = 0;
                                let predictedTime = 0;
                                
                                // Try format 1: nanoseconds in usage
                                if (usage.prompt_eval_time || usage.eval_time) {
                                    promptTime = (usage.prompt_eval_time || 0) / 1e9;
                                    predictedTime = (usage.eval_time || 0) / 1e9;
                                }
                                // Try format 2: milliseconds in timings object
                                else if (json.timings) {
                                    promptTime = (json.timings.prompt_ms || 0) / 1000;
                                    predictedTime = (json.timings.predicted_ms || 0) / 1000;
                                }
                                // Try format 3: milliseconds in usage
                                else if (usage.prompt_time_ms || usage.completion_time_ms) {
                                    promptTime = (usage.prompt_time_ms || 0) / 1000;
                                    predictedTime = (usage.completion_time_ms || 0) / 1000;
                                }
                                // Fallback: estimate from token counts (rough approximation)
                                else if (completionTokens > 0) {
                                    // Assume ~50 tok/sec as baseline if no timing data
                                    predictedTime = completionTokens / 50;
                                    promptTime = promptTokens / 100; // Prompt processing is usually faster
                                }
                                
                                const totalTime = promptTime + predictedTime;
                                const tokensPerSec = predictedTime > 0 ? (completionTokens / predictedTime) : 0;
                                
                                // Get finish reason from choices if available
                                const finishReason = json.choices?.[0]?.finish_reason || 'stop';
                                
                                // Send enhanced metrics chunk
                                const metricsChunk = {
                                    id: json.id,
                                    object: 'chat.completion.chunk',
                                    created: json.created,
                                    model: json.model,
                                    choices: [],
                                    usage: {
                                        prompt_tokens: promptTokens,
                                        completion_tokens: completionTokens,
                                        total_tokens: totalTokens
                                    },
                                    metrics: {
                                        tokens_per_sec: parseFloat(tokensPerSec.toFixed(2)),
                                        prompt_time_sec: parseFloat(promptTime.toFixed(2)),
                                        generation_time_sec: parseFloat(predictedTime.toFixed(2)),
                                        total_time_sec: parseFloat(totalTime.toFixed(2)),
                                        stop_reason: finishReason
                                    }
                                };
                                
                                console.log('Real metrics extracted:', metricsChunk.metrics);
                                res.write(`data: ${JSON.stringify(metricsChunk)}\n\n`);
                            } else {
                                // Regular token chunk, pass through
                                res.write(`data: ${data}\n\n`);
                            }
                        } catch (e) {
                            // Invalid JSON, pass through as-is
                            res.write(line + '\n');
                        }
                    } else if (line.trim()) {
                        res.write(line + '\n');
                    }
                }
            });

            response.data.on('end', () => {
                res.end();
            });

            response.data.on('error', (err) => {
                console.error('Stream error:', err);
                res.end();
            });
        } else {
            const response = await axios.post(`${ORCHESTRATOR_URL}/v1/chat/completions`, req.body);
            res.json(response.data);
        }
    } catch (error) {
        console.error("Inference Proxy Error:", error.message);
        res.status(500).json({ error: 'Inference failed: Cluster unreachable or model load timeout' });
    }
});

app.listen(PORT, () => {
    console.log(`NeuronGrid UI Backend running on http://localhost:${PORT}`);
});
