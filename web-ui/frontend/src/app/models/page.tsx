'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, SlidersHorizontal, RotateCw, CheckCircle2, Eye, Wrench, Info, 
  Bot, Copy, X, Download, Star, Sparkles, Box, FileDown, ThumbsUp, AlertTriangle, User, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FALLBACK_MODELS = [
  {
    id: 'qwen/qwen3.6-35b-a3b',
    name: 'Qwen3.6 35B A3B',
    provider: 'Qwen',
    verified: true,
    desc: 'Qwen3.6 prioritizes stability and real-world utility, offering developers a more intuitive, responsive, and genuinely productive coding experience.',
    time: '13 hours ago',
    active: true,
    color: 'bg-white text-black',
    downloads: '13,942',
    likes: '5',
    params: '35B',
    arch: 'qwen35moe',
    domain: 'llm',
    format: 'GGUF',
  },
  {
    id: 'google/gemma-4-31b',
    name: 'Gemma 4 31B',
    provider: 'Google',
    verified: true,
    desc: '31B dense Gemma4 variant. Supports vision input, reasoning, and to...',
    time: '6 days ago',
    active: false,
    color: 'bg-zinc-800 text-white',
  },
];

export default function ModelsPage() {
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Search Models
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const queryParam = searchQuery ? `?query=${searchQuery}` : '';
        const res = await axios.get(`http://localhost:3001/api/models/search${queryParam}`);
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((m: any) => ({
            id: m.id,
            name: m.id.split('/').pop() || m.id,
            provider: m.author || m.id.split('/')[0] || 'Unknown',
            verified: m.downloads > 1000,
            desc: `HuggingFace repository with ${m.likes} likes and ${m.downloads} downloads.`,
            time: (m.last_modified || '').split('T')[0] || 'Recently',
            downloads: m.downloads?.toLocaleString() || '0',
            likes: m.likes?.toLocaleString() || '0',
            params: 'N/A', arch: 'transformer', domain: 'text', format: 'GGUF',
            color: 'bg-zinc-800 text-white'
          }));
          setModels(mapped);
          
          // Select first if current selected is not in list
          if (!selectedModel || !mapped.find((m: any) => m.id === selectedModel.id)) {
            setSelectedModel(mapped[0]);
          }
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoadingModels(false);
      }
    };
    
    const timeout = setTimeout(fetchModels, 800); // debounce
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const [downloads, setDownloads] = useState<{[key: string]: any}>({});

  // Poll active downloads
  useEffect(() => {
    const pollDownloads = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/models/downloads');
        setDownloads(res.data);
      } catch (err) {
        console.error("Error polling downloads", err);
      }
    };
    const interval = setInterval(pollDownloads, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Files for Selected Model
  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedModel) return;
      setLoadingFiles(true);
      setFiles([]);
      try {
        const res = await axios.get(`http://localhost:3001/api/models/files`, {
          params: { repo_id: selectedModel.id }
        });
        setFiles(res.data || []);
      } catch (err) {
        console.error("Fetch files failed:", err);
      } finally {
        setLoadingFiles(false);
      }
    };
    fetchFiles();
  }, [selectedModel]);

  const handleDownload = async (file: any) => {
    if (downloads[file.filename] && downloads[file.filename].status === 'downloading') return;

    try {
      await axios.post('http://localhost:3001/api/models/download', {
        filename: file.filename,
        download_url: file.download_url
      });
      // The polling loop will pick up the progress in the next tick
    } catch (err) {
      console.error("Failed to start download:", err);
      alert("Failed to start download. Check console for details.");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-black text-white font-sans overflow-hidden border-t border-zinc-900 selection:bg-white selection:text-black">
      
      {/* Left Sidebar - Model List */}
      <div className="w-[450px] flex flex-col border-r border-zinc-900 bg-black shrink-0">
        
        {/* Search Header */}
        <div className="p-6 space-y-5 border-b border-zinc-900 bg-zinc-950/50">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search neural assets by name or author..." 
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
            />
            {loadingModels && <Loader2 size={16} className="absolute right-5 animate-spin text-zinc-500" />}
          </div>
          <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold text-zinc-500">
            <div className="flex items-center space-x-2">
              <span>Enterprise Catalog</span>
              <RotateCw size={12} className="cursor-pointer hover:text-white transition-colors" />
            </div>
            <div className="flex items-center space-x-3 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              <select className="bg-transparent text-white text-xs focus:outline-none appearance-none cursor-pointer">
                <option className="bg-zinc-900 text-white">Best Match</option>
                <option className="bg-zinc-900 text-white">Most Downloads</option>
                <option className="bg-zinc-900 text-white">Recently Updated</option>
              </select>
              <SlidersHorizontal size={14} className="text-zinc-400 cursor-pointer hover:text-white" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative bg-black">
          {models.map((model) => {
            const isSelected = selectedModel?.id === model.id;
            return (
              <div 
                key={model.id} 
                onClick={() => setSelectedModel(model)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'bg-zinc-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'bg-black border-zinc-900 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                    <span className="font-black text-lg tracking-tighter uppercase">
                      {(model.provider || '?')[0]}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className={`font-black truncate text-base ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{model.name}</span>
                        {model.verified && <CheckCircle2 size={14} className={`${isSelected ? 'text-white' : 'text-zinc-500'} shrink-0`} />}
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <div className="border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-500"><Eye size={10} /></div>
                        <div className="border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-500"><Wrench size={10} /></div>
                      </div>
                    </div>
                    <p className={`text-xs truncate mb-2 ${isSelected ? 'text-zinc-400' : 'text-zinc-600'}`}>{model.desc}</p>
                    <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest text-right w-full">{model.time}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {models.length === 0 && !loadingModels && (
            <div className="text-center text-zinc-600 text-sm mt-10 font-bold uppercase tracking-widest italic">No assets found in catalog.</div>
          )}
        </div>
      </div>

      {/* Right Main Area - Model Details */}
      <div className="flex-1 bg-[#050505] flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-transparent pointer-events-none"></div>

        {/* Top Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-zinc-900 relative z-10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center space-x-4 text-zinc-100">
            <Bot size={24} className="text-zinc-500" />
            <h1 className="text-2xl font-black tracking-tight">{selectedModel?.id || 'Select a model'}</h1>
            <Copy size={16} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" />
          </div>
          <X size={24} className="text-zinc-600 cursor-pointer hover:text-white transition-colors" />
        </div>

        {/* Content Area */}
        {selectedModel ? (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
            <div className="max-w-5xl space-y-8">
              
              {/* Stats Row */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-zinc-300 font-bold bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                  <Download size={16} className="text-zinc-500"/> <span>{selectedModel.downloads || '10k+'}</span>
                </div>
                <div className="flex items-center space-x-2 text-zinc-300 font-bold bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                  <Star size={16} className="text-zinc-500"/> <span>{selectedModel.likes || '4.5'}</span>
                </div>
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest pl-2">
                  Updated: {selectedModel.time}
                </div>
                <div className="ml-auto">
                  <div className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-white/5">
                    <Sparkles size={14}/> <span>Enterprise Certified</span>
                  </div>
                </div>
              </div>

              {/* Description Block */}
              <div className="bg-black border border-zinc-900 p-8 rounded-[2rem] text-base leading-relaxed text-zinc-400 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">{selectedModel.desc}</div>
                <div className="absolute -right-10 -top-10 text-zinc-900 opacity-20"><Bot size={150} /></div>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg"><span className="text-zinc-600 font-bold uppercase tracking-widest">Params</span> <span className="text-white font-black">{selectedModel.params || 'N/A'}</span></div>
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg"><span className="text-zinc-600 font-bold uppercase tracking-widest">Arch</span> <span className="text-white font-black">{selectedModel.arch || 'transformer'}</span></div>
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg"><span className="text-zinc-600 font-bold uppercase tracking-widest">Domain</span> <span className="text-white font-black uppercase">{selectedModel.domain || 'text'}</span></div>
                <div className="flex items-center space-x-2 bg-white text-black px-3 py-1.5 rounded-lg"><span className="font-bold uppercase tracking-widest opacity-60">Format</span> <span className="font-black">{selectedModel.format || 'GGUF'}</span></div>
              </div>

              {/* Capabilities */}
              <div className="flex items-center space-x-4 text-xs pt-4">
                <span className="text-zinc-600 font-bold uppercase tracking-widest">Engine Capabilities:</span>
                <div className="flex items-center space-x-2 bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
                  <Eye size={14}/> <span>Vision</span>
                </div>
                <div className="flex items-center space-x-2 bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
                  <Wrench size={14}/> <span>Tool Use</span>
                </div>
                <div className="flex items-center space-x-2 bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider">
                  <Info size={14}/> <span>Reasoning</span>
                </div>
              </div>

              {/* Download Options Box */}
              <div className="mt-8 border border-zinc-900 rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                <div className="bg-zinc-950 border-b border-zinc-900 p-6 flex items-center justify-between font-black text-sm text-white uppercase tracking-widest">
                  <div className="flex items-center space-x-3">
                    <Box size={18} className="text-zinc-500"/> <span>Deployment Targets</span>
                  </div>
                  {loadingFiles && <Loader2 size={18} className="animate-spin text-zinc-500" />}
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Active download target */}
                  {files.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-4 truncate mr-4">
                        <span className="bg-white text-black text-[10px] px-2 py-1 rounded md font-black shrink-0">GGUF</span>
                        <span className="text-white font-black truncate text-lg" title={files[0].filename}>{files[0].filename.replace('.gguf', '')}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-zinc-400 font-black shrink-0">
                        <span>{files[0].size_gb} GB</span>
                        <SlidersHorizontal size={16} className="text-white"/>
                      </div>
                    </div>
                  )}

                  {/* Sub-options list */}
                  <div className="pt-4">
                    <h4 className="text-xs font-black text-zinc-500 mb-4 uppercase tracking-widest">Available Quantizations</h4>
                    <div className="space-y-2">
                      
                      {!loadingFiles && files.length === 0 && (
                        <div className="text-zinc-600 text-sm font-bold italic py-6 text-center uppercase tracking-widest">No GGUF deployment files found.</div>
                      )}

                      {files.map((file: any, i: number) => {
                        const dl = downloads[file.filename];
                        return (
                        <div key={i} className="group flex flex-col p-3 rounded-xl hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-4 truncate mr-4">
                              {i === 0 ? <CheckCircle2 size={18} className="text-white shrink-0"/> : <div className="w-[18px] shrink-0" />}
                              <span className="bg-white text-black text-[9px] px-1.5 py-0.5 rounded font-black shrink-0">GGUF</span>
                              <span className="text-zinc-300 text-sm font-bold truncate" title={file.filename}>
                                {file.filename.replace('.gguf', '')}
                              </span>
                              <div className="border border-zinc-700 text-zinc-500 rounded p-1 shrink-0"><Eye size={12}/></div>
                            </div>
                            
                            {!dl || dl.status !== 'downloading' ? (
                              <div className="flex items-center space-x-6 shrink-0">
                                {file.size_gb > 20 && (
                                  <div className="flex items-center space-x-1.5 bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <X size={12}/> <span>Exceeds VRAM</span>
                                  </div>
                                )}
                                {dl?.status === 'completed' ? (
                                  <div className="flex items-center space-x-1.5 bg-white text-black border border-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={12}/> <span>Downloaded</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-2 border border-zinc-800 bg-zinc-950 rounded-lg hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer text-zinc-400"><ThumbsUp size={16}/></div>
                                    <div 
                                      onClick={() => handleDownload(file)}
                                      className="p-2 border border-zinc-800 bg-zinc-950 rounded-lg hover:bg-white hover:text-black hover:border-white transition-colors cursor-pointer text-white"
                                    >
                                      <FileDown size={16}/>
                                    </div>
                                  </div>
                                )}
                                <span className="text-zinc-400 text-sm font-black w-20 text-right">{file.size_gb} GB</span>
                              </div>
                            ) : (
                               <div className="flex items-center space-x-4 shrink-0 w-64 justify-end">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right w-20 truncate">{dl.speed}</div>
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right w-16 truncate">{dl.eta}</div>
                                  <span className="text-zinc-400 text-sm font-black w-20 text-right">{file.size_gb} GB</span>
                               </div>
                            )}
                          </div>
                          
                          {/* Progress Bar Row */}
                          {dl && dl.status === 'downloading' && (
                            <div className="mt-3 w-full pl-[72px] pr-[104px]">
                               <div className="flex justify-between items-center mb-1.5">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Downloading Neural Weights...</span>
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white">{Math.floor(dl.progress)}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 shadow-inner">
                                  <div 
                                    className="h-full bg-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                                    style={{ width: `${dl.progress}%` }}
                                  ></div>
                               </div>
                            </div>
                          )}
                        </div>
                        );
                      })}

                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights Section */}
              <div className="pt-8 space-y-6">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Capabilities Overview</h3>
                <div className="bg-black border border-zinc-900 rounded-[2rem] p-8 shadow-2xl">
                  <ul className="space-y-4 text-sm text-zinc-400 marker:text-white">
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div>
                      <div><strong className="text-white font-black">Agentic Execution:</strong> Handles frontend workflows and repository-level reasoning with enterprise-grade precision.</div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0"></div>
                      <div><strong className="text-white font-black">Context Preservation:</strong> Retains reasoning context from historical states, reducing architectural overhead.</div>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Footer tag */}
              <div className="border-t border-zinc-900 pt-8 mt-12 pb-16 flex items-center text-xs font-black uppercase tracking-widest text-zinc-600 space-x-3">
                 <User size={18}/> <span>Enterprise Model Catalog | {selectedModel.provider?.toUpperCase() || 'UNKNOWN'}</span>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-700 font-black uppercase tracking-widest italic text-sm">
            Select a neural asset to view specifications.
          </div>
        )}
      </div>
      
      {/* Global styling for custom scrollbar to match enterprise dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #18181b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #27272a;
        }
      `}} />
    </div>
  );
}
