'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Eye, Wrench, Info, MoreHorizontal, Settings, Play, Code, Cpu, HardDrive, 
  ChevronRight, ChevronDown, Activity, TerminalSquare, SlidersHorizontal, ArrowRight, Folder, Bot,
  MessageSquare, FileDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocalModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedSection, setExpandedSection] = useState('System Prompt');

  // State for configuration
  const [systemPrompt, setSystemPrompt] = useState('You are Neuron, a highly capable AI assistant running securely on a private local cluster. You are helpful, precise, and concise.');
  const [contextLength, setContextLength] = useState(8192);

  useEffect(() => {
    const fetchLocalModels = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/local-models');
        setModels(res.data);
        if (res.data.length > 0 && !selectedModelId) {
          setSelectedModelId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch local models", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalModels();
  }, [selectedModelId]);

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const totalSize = models.reduce((acc, curr) => acc + parseFloat(curr.size_gb || 0), 0).toFixed(2);

  const toggleSection = (title: string) => {
    if (expandedSection === title) {
      setExpandedSection('');
    } else {
      setExpandedSection(title);
    }
  };

  const formatTimeAgo = (ms: number) => {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 bg-black">
        <h1 className="text-lg font-black tracking-tight uppercase">My Models</h1>
        <div className="relative w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter models... (Ctrl + F)" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Categories) */}
        <div className="w-48 border-r border-zinc-900 bg-zinc-950/30 shrink-0 p-4 space-y-2">
          <div 
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide cursor-pointer transition-all ${activeCategory === 'all' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            View All
          </div>
          <div 
            onClick={() => setActiveCategory('llms')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide cursor-pointer transition-all ${activeCategory === 'llms' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            LLMs
          </div>
          <div 
            onClick={() => setActiveCategory('embedding')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide cursor-pointer transition-all ${activeCategory === 'embedding' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            Text Embedding
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-zinc-900 text-xs font-black uppercase tracking-widest text-zinc-600 shrink-0">
            <div>Arch</div>
            <div>Params</div>
            <div>Publisher</div>
            <div>LLM</div>
            <div>Quant</div>
            <div>Size</div>
            <div>Modified</div>
            <div className="text-right w-16">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
            {loading ? (
              <div className="flex justify-center items-center h-full text-zinc-600 font-black uppercase tracking-widest italic text-sm">
                <Loader2 size={16} className="animate-spin mr-3" /> Fetching Storage Matrix...
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center text-zinc-600 text-sm mt-10 font-bold uppercase tracking-widest italic">
                No local models found on disk.
              </div>
            ) : (
              <motion.div 
                initial="hidden" animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                }}
                className="space-y-1"
              >
                {filteredModels.map((model) => {
                  const isSelected = selectedModelId === model.id;
                  return (
                    <motion.div 
                      key={model.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      onClick={() => setSelectedModelId(model.id)}
                      className={`grid grid-cols-[1fr_1fr_1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-xl cursor-pointer border transition-all ${
                        isSelected 
                          ? 'bg-zinc-900 border-zinc-700 shadow-lg' 
                          : 'bg-black border-transparent hover:bg-zinc-950 hover:border-zinc-900'
                      }`}
                    >
                      <div>
                        <span className="border border-zinc-800 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-zinc-300">{model.arch}</span>
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-300">{model.params}</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-400 truncate pr-4">{model.publisher}</div>
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`} title={model.name}>{model.name}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          {model.capabilities.includes('vision') && <div className="border border-zinc-800 text-yellow-600 rounded px-1 py-0.5"><Eye size={10} /></div>}
                          {model.capabilities.includes('tool') && <div className="border border-zinc-800 text-zinc-400 rounded px-1 py-0.5"><Wrench size={10} /></div>}
                          {model.capabilities.includes('text') && <div className="border border-zinc-800 text-zinc-400 rounded px-1 py-0.5"><Info size={10} /></div>}
                        </div>
                      </div>
                      <div>
                        <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-zinc-300">{model.quant}</span>
                      </div>
                      <div className="text-xs font-black tracking-widest text-zinc-400">{model.size_gb} GB</div>
                      <div className="text-xs font-bold text-zinc-500">{formatTimeAgo(model.modifiedMs)}</div>
                      <div className="flex items-center justify-end space-x-2 w-16">
                        <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"><MoreHorizontal size={14} /></button>
                        <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"><Settings size={14} /></button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="h-10 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between px-6 text-xs font-bold text-zinc-500 shrink-0">
            <div className="uppercase tracking-widest">
              You have <span className="text-white font-black">{models.length} local models</span>, taking up <span className="text-white font-black">{totalSize} GB</span> of disk space
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 border border-zinc-800 bg-black px-3 py-1 rounded-md cursor-pointer hover:border-zinc-600 transition-colors">
                <Folder size={12} className="text-zinc-400" />
                <span className="font-mono text-[10px] tracking-tight">C:\Users\nilab\.neurongrid\models</span>
              </div>
              <MoreHorizontal size={14} className="cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Right Sidebar (Details) */}
        <div className="w-[400px] border-l border-zinc-900 bg-[#070707] shrink-0 flex flex-col">
          
          {selectedModel ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-zinc-900 flex items-start justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <Bot size={18} className="text-zinc-500 shrink-0" />
                  <h2 className="text-sm font-black tracking-tight text-white truncate" title={selectedModel.name}>{selectedModel.name.toUpperCase()}</h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-950">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button className="flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg py-2 text-xs font-black uppercase tracking-widest transition-colors">
                    <MessageSquare size={12} />
                    <span>Use in New Chat</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg py-2 text-xs font-black uppercase tracking-widest transition-colors">
                    <Code size={12} />
                    <span>Local Server</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <button className="flex items-center justify-center space-x-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                    <Info size={12} />
                    <span>Info</span>
                  </button>
                  <button className="flex items-center justify-center space-x-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                    <HardDrive size={12} />
                    <span>Load</span>
                  </button>
                  <button className="flex items-center justify-center space-x-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-white/10">
                    <Activity size={12} />
                    <span>Inference</span>
                  </button>
                </div>
              </div>

              {/* Settings Accordion */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                
                {/* System Prompt Section */}
                <div className="border border-transparent hover:border-zinc-800 rounded-xl transition-all overflow-hidden mb-1">
                  <div 
                    onClick={() => toggleSection('System Prompt')}
                    className={`flex items-center justify-between p-3 cursor-pointer ${expandedSection === 'System Prompt' ? 'bg-zinc-900/80' : 'hover:bg-zinc-900/50'}`}
                  >
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <TerminalSquare size={14} className={expandedSection === 'System Prompt' ? 'text-white' : 'text-zinc-500'} />
                      <span className={`text-xs font-bold ${expandedSection === 'System Prompt' ? 'text-white' : ''}`}>System Prompt</span>
                    </div>
                    {expandedSection === 'System Prompt' ? <ChevronDown size={14} className="text-white" /> : <ChevronRight size={14} className="text-zinc-600" />}
                  </div>
                  {expandedSection === 'System Prompt' && (
                    <div className="p-3 pt-0 bg-zinc-900/80">
                      <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-white transition-colors resize-none h-32 custom-scrollbar"
                        placeholder="Enter system instructions..."
                      />
                    </div>
                  )}
                </div>

                {/* Settings Section (Context Length) */}
                <div className="border border-transparent hover:border-zinc-800 rounded-xl transition-all overflow-hidden mb-1">
                  <div 
                    onClick={() => toggleSection('Settings')}
                    className={`flex items-center justify-between p-3 cursor-pointer ${expandedSection === 'Settings' ? 'bg-zinc-900/80' : 'hover:bg-zinc-900/50'}`}
                  >
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <Settings size={14} className={expandedSection === 'Settings' ? 'text-white' : 'text-zinc-500'} />
                      <span className={`text-xs font-bold ${expandedSection === 'Settings' ? 'text-white' : ''}`}>Settings</span>
                    </div>
                    {expandedSection === 'Settings' ? <ChevronDown size={14} className="text-white" /> : <ChevronRight size={14} className="text-zinc-600" />}
                  </div>
                  {expandedSection === 'Settings' && (
                    <div className="p-4 pt-2 bg-zinc-900/80 space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-bold text-zinc-400">Context Length</span>
                          <span className="font-mono font-black text-white">{contextLength}</span>
                        </div>
                        <input 
                          type="range" 
                          min="128" 
                          max="32768" 
                          step="128"
                          value={contextLength}
                          onChange={(e) => setContextLength(Number(e.target.value))}
                          className="w-full accent-white"
                        />
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">
                          <span>128</span>
                          <span>32K</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {[
                  { title: 'Reasoning Parsing', icon: SlidersHorizontal },
                  { title: 'Sampling', icon: Activity },
                  { title: 'Structured Output', icon: Code },
                  { title: 'Speculative Decoding', icon: Cpu },
                  { title: 'Prompt Template', icon: FileDown }
                ].map((section, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 cursor-pointer border border-transparent hover:border-zinc-800 transition-all">
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <section.icon size={14} className="text-zinc-500" />
                      <span className="text-xs font-bold">{section.title}</span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </div>
                ))}
              </div>
            </>
          ) : (
             <div className="flex-1 flex items-center justify-center text-zinc-700 font-black uppercase tracking-widest italic text-xs px-6 text-center">
               No model selected. Download models from the library to configure them here.
             </div>
          )}
        </div>

      </div>

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
        
        input[type=range] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #27272a;
          border-radius: 2px;
        }
      `}} />
    </div>
  );
}
