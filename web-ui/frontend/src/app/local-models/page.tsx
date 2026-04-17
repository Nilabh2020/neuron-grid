'use client';

import React, { useState } from 'react';
import { 
  Search, Eye, Wrench, Info, MoreHorizontal, Settings, Play, Code, Cpu, HardDrive, 
  ChevronRight, Activity, TerminalSquare, SlidersHorizontal, ArrowRight, Folder, Bot,
  MessageSquare, FileDown
} from 'lucide-react';

const MOCK_LOCAL_MODELS = [
  {
    id: '1',
    arch: 'qwen35moe',
    params: '35B-A3B',
    publisher: 'unsloth',
    name: 'qwen3.6-35b-a3b',
    quant: 'Q4_K_S',
    size: '22.7 GB',
    modified: '43 mins ago',
    capabilities: ['vision', 'tool'],
    active: true
  },
  {
    id: '2',
    arch: 'gemma4',
    params: '26B-A4B',
    publisher: 'Ex0bit',
    name: 'mythos-26b-a4b-prism...',
    quant: 'Q4_K_M',
    size: '19.3 GB',
    modified: '3 days ago',
    capabilities: ['vision', 'tool'],
    active: false
  },
  {
    id: '3',
    arch: 'gemma4',
    params: '7.5B',
    publisher: 'lmstudio-community',
    name: 'gemma-4-e4b-it',
    quant: 'Q4_K_M',
    size: '6.3 GB',
    modified: '6 days ago',
    capabilities: ['vision', 'tool'],
    active: false
  },
  {
    id: '4',
    arch: 'qwen35',
    params: '4B',
    publisher: 'lmstudio-community',
    name: 'qwen3.5-4b',
    quant: 'Q4_K_M',
    size: '3.4 GB',
    modified: '6 days ago',
    capabilities: ['vision', 'tool'],
    active: false
  },
  {
    id: '5',
    arch: 'qwen35',
    params: '752M',
    publisher: 'Jackrong',
    name: 'qwen3.5-0.8b-claude-4.6...',
    quant: 'Q8_0',
    size: '811.8 MB',
    modified: '6 days ago',
    capabilities: ['vision', 'tool'],
    active: false
  },
  {
    id: '6',
    arch: 'qwen35',
    params: '9B',
    publisher: 'lmstudio-community',
    name: 'qwen/qwen3.5-9b',
    quant: 'Q4_K_M',
    size: '6.5 GB',
    modified: '7 days ago',
    capabilities: ['vision', 'tool', 'reasoning'],
    active: false
  },
  {
    id: '7',
    arch: 'mistral3',
    params: '24B',
    publisher: 'lmstudio-community',
    name: 'mistralai/devstral-s...',
    quant: 'Q3_K_L',
    size: '13.3 GB',
    modified: '10 days ago',
    capabilities: ['vision', 'tool'],
    active: false
  },
];

export default function LocalModelsPage() {
  const [selectedModelId, setSelectedModelId] = useState('1');
  const [activeCategory, setActiveCategory] = useState('all');

  const selectedModel = MOCK_LOCAL_MODELS.find(m => m.id === selectedModelId) || MOCK_LOCAL_MODELS[0];

  return (
    <div className="h-[calc(100vh)] flex flex-col bg-black text-white font-sans overflow-hidden selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 bg-black">
        <h1 className="text-lg font-black tracking-tight uppercase">My Models</h1>
        <div className="relative w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
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
            {MOCK_LOCAL_MODELS.map((model) => {
              const isSelected = selectedModelId === model.id;
              return (
                <div 
                  key={model.id}
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
                    <span className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{model.name}</span>
                    <div className="flex items-center space-x-1 shrink-0">
                      {model.capabilities.includes('vision') && <div className="border border-zinc-800 text-yellow-600 rounded px-1 py-0.5"><Eye size={10} /></div>}
                      {model.capabilities.includes('tool') && <div className="border border-zinc-800 text-blue-600 rounded px-1 py-0.5"><Wrench size={10} /></div>}
                      {model.capabilities.includes('reasoning') && <div className="border border-zinc-800 text-green-600 rounded px-1 py-0.5"><Info size={10} /></div>}
                    </div>
                  </div>
                  <div>
                    <span className="border border-zinc-800 bg-zinc-950 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-zinc-300">{model.quant}</span>
                  </div>
                  <div className="text-xs font-black tracking-widest text-zinc-400">{model.size}</div>
                  <div className="text-xs font-bold text-zinc-500">{model.modified}</div>
                  <div className="flex items-center justify-end space-x-2 w-16">
                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"><MoreHorizontal size={14} /></button>
                    <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"><Settings size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Status Bar */}
          <div className="h-10 border-t border-zinc-900 bg-zinc-950/50 flex items-center justify-between px-6 text-xs font-bold text-zinc-500 shrink-0">
            <div className="uppercase tracking-widest">
              You have <span className="text-white font-black">{MOCK_LOCAL_MODELS.length} local models</span>, taking up <span className="text-white font-black">285.65 GB</span> of disk space
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
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-900 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Bot size={18} className="text-zinc-500" />
              <h2 className="text-sm font-black tracking-tight text-white">{selectedModel.name.toUpperCase()}-GGUF</h2>
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
            {[
              { title: 'System Prompt', icon: TerminalSquare },
              { title: 'Settings', icon: Settings },
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
      `}} />
    </div>
  );
}
