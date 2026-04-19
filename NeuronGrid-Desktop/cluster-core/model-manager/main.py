import os
import logging
import requests
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from huggingface_hub import HfApi
# ModelFilter is deprecated, we use parameters directly in list_models
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
        kwargs = {
            "filter": "gguf",
            "sort": "downloads",
            "limit": limit
        }
        
        query = query.strip()
        if query:
            kwargs["search"] = query
            
        models = hf_api.list_models(**kwargs)
        
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
    """List available GGUF files in a repository, aggregating split files."""
    try:
        model_info = hf_api.model_info(repo_id=repo_id, files_metadata=True)
        gguf_files = {}
        
        for file in model_info.siblings:
            if file.rfilename.endswith(".gguf"):
                filename = file.rfilename.split("/")[-1]
                size_gb = file.size / (1024**3) if file.size else 0
                
                # Check for split files like "model-00001-of-00005.gguf"
                match = re.search(r"^(.*)-[0-9]{5}-of-[0-9]{5}\.gguf$", filename)
                if match:
                    base_name = match.group(1) + ".gguf"
                else:
                    base_name = filename
                
                if base_name not in gguf_files:
                    gguf_files[base_name] = {
                        "filename": base_name,
                        "size_gb": 0,
                        "download_url": f"https://huggingface.co/{repo_id}/resolve/main/{file.rfilename}"
                    }
                
                gguf_files[base_name]["size_gb"] += size_gb
                
        # Format the final result
        results = list(gguf_files.values())
        for r in results:
            r["size_gb"] = round(r["size_gb"], 2)
            
        results.sort(key=lambda x: x["size_gb"])
        return results
    except Exception as e:
        logger.error(f"Error fetching files for {repo_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
