import os
import time
import json
import logging
import requests
import aiofiles
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from llama_cpp import Llama
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model-runner")

app = FastAPI(title="NeuronGrid Model Runner")

# Storage paths
MODELS_DIR = os.getenv("MODELS_DIR", "./models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Loaded model cache
loaded_models: Dict[str, Llama] = {}

class ChatCompletionRequest(BaseModel):
    model_name: str
    messages: List[dict]
    max_tokens: int = 512
    temperature: float = 0.7
    stream: bool = True

class DownloadRequest(BaseModel):
    model_id: str
    download_url: str

@app.get("/")
async def root():
    return {"status": "Model Runner Online", "models_loaded": list(loaded_models.keys())}

@app.post("/download")
async def download_model(req: DownloadRequest):
    """Download a GGUF model file."""
    filename = req.download_url.split("/")[-1]
    filepath = os.path.join(MODELS_DIR, filename)
    
    if os.path.exists(filepath):
        return {"message": "Model already exists", "path": filepath}
    
    logger.info(f"Downloading model {req.model_id} from {req.download_url}")
    
    try:
        response = requests.get(req.download_url, stream=True)
        response.raise_for_status()
        
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return {"message": "Download complete", "path": filepath}
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/completions")
async def create_completion(req: ChatCompletionRequest):
    """Run inference on a loaded model."""
    filename = req.model_name
    filepath = os.path.join(MODELS_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Model {filename} not found. Download it first.")
    
    # Load model into memory if not already loaded
    if filename not in loaded_models:
        logger.info(f"Loading model: {filename}")
        try:
            # Simple loading, using default settings (CPU-focused for MVP)
            loaded_models[filename] = Llama(model_path=filepath, n_ctx=2048)
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Load error: {e}")
    
    llm = loaded_models[filename]
    
    # Format basic prompt (OpenAI-style messages to llama-cpp format)
    prompt = ""
    for msg in req.messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        prompt += f"{role}: {content}\n"
    prompt += "assistant: "

    if req.stream:
        def generate():
            for output in llm(prompt, max_tokens=req.max_tokens, temperature=req.temperature, stream=True):
                token = output["choices"][0]["text"]
                yield f"data: {json.dumps({'content': token})}\n\n"
        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        output = llm(prompt, max_tokens=req.max_tokens, temperature=req.temperature)
        return {"content": output["choices"][0]["text"]}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("MODEL_RUNNER_PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
