import os
import logging
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from huggingface_hub import HfApi, ModelFilter
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model-manager")

app = FastAPI(title="NeuronGrid Model Manager")
hf_api = HfApi()

class ModelSearchQuery(BaseModel):
    query: str
    limit: int = 10

class ModelInfo(BaseModel):
    id: str
    author: str
    last_modified: str
    likes: int
    downloads: int
    tags: List[str]

class GGUFFileInfo(BaseModel):
    filename: str
    size_gb: float
    download_url: str

@app.get("/")
async def root():
    return {"status": "Model Manager Online"}

@app.get("/search")
async def search_models(query: str, limit: int = 10):
    """Search HuggingFace for GGUF models."""
    try:
        # Filter specifically for GGUF tags
        models = hf_api.list_models(
            search=f"{query} gguf",
            sort="downloads",
            direction=-1,
            limit=limit
        )
        
        results = []
        for model in models:
            results.append({
                "id": model.id,
                "author": model.author,
                "last_modified": str(model.last_modified),
                "likes": getattr(model, "likes", 0),
                "downloads": getattr(model, "downloads", 0),
                "tags": model.tags
            })
        return results
    except Exception as e:
        logger.error(f"HF Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/{repo_id:path}/files")
async def get_model_files(repo_id: str):
    """List available GGUF files in a repository."""
    try:
        files = hf_api.list_repo_files(repo_id=repo_id)
        gguf_files = []
        
        for file in files:
            if file.endswith(".gguf"):
                # Get file metadata
                info = hf_api.get_paths_info(repo_id=repo_id, paths=[file])[0]
                gguf_files.append({
                    "filename": file,
                    "size_gb": round(info.size / (1024**3), 2),
                    "download_url": f"https://huggingface.co/{repo_id}/resolve/main/{file}"
                })
        return gguf_files
    except Exception as e:
        logger.error(f"Error fetching files for {repo_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
