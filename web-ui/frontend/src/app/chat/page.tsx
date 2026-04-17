'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles, Activity, Network } from 'lucide-react';

export default function ChatPlayground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('llama-3-8b.gguf');
  const [telemetry, setTelemetry] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setTelemetry("Profiling heterogeneous cluster...");

    try {
      const res = await axios.post('http://localhost:3001/api/chat', {
        model: model,
        messages: newMessages,
        stream: false
      });
      
      setMessages([...newMessages, { role: 'assistant', content: res.data.content }]);
      setTelemetry("Inference complete. Awaiting next prompt.");
    } catch (err) {
      console.error("Chat error", err);
      setMessages([...newMessages, { role: 'assistant', content: "Error: Failed to reach cluster or orchestrator." }]);
      setTelemetry("Cluster connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col max-w-5xl mx-auto relative">
      <header className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center space-x-3">
            <Sparkles className="text-zinc-400" size={32} />
            <span>AI Playground</span>
          </h2>
          <p className="text-zinc-500 text-lg">Test your cluster's distributed inference power.</p>
        </div>
        <div className="flex flex-col items-end space-y-3">
          {telemetry && (
            <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-800">
              <Network size={12} className="text-zinc-500" />
              <span>{telemetry}</span>
            </div>
          )}
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-white transition-colors cursor-pointer"
          >
            <option value="llama-3-8b.gguf">Llama 3 8B (GGUF)</option>
            <option value="mistral-7b.gguf">Mistral 7B (GGUF)</option>
          </select>
        </div>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-32 pr-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl">
              <MessageSquare size={40} className="text-zinc-500" />
            </div>
            <p className="text-2xl font-medium italic text-zinc-500">"Tell me a story about a decentralized AI cluster..."</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-white text-black' : 'bg-zinc-900 border border-zinc-700 text-white'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-5 rounded-2xl text-base leading-relaxed ${msg.role === 'user' ? 'bg-white text-black font-medium' : 'bg-[#111] border border-zinc-800 text-zinc-300 shadow-2xl shadow-black/50'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={20} className="text-zinc-600" />
              </div>
              <div className="p-5 bg-[#111] border border-zinc-800 rounded-2xl w-24 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-6 left-0 right-0 max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-500 to-zinc-800 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition-opacity duration-500" />
          <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 pr-3 shadow-2xl">
            <input
              type="text"
              placeholder="Message your heterogeneous cluster..."
              className="flex-1 bg-transparent border-none outline-none px-5 py-2 text-white placeholder-zinc-600 text-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-white text-black hover:bg-zinc-200 p-3.5 rounded-xl transition-all disabled:opacity-30 shadow-lg"
            >
              <Send size={20} className={loading ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mt-4 text-[11px] text-zinc-500 uppercase tracking-widest font-bold">
          <Activity size={12} />
          <span>Powered by NeuronGrid Orchestrator • Asymmetric Tensor Parallelism Active</span>
        </div>
      </div>
    </div>
  );
}

const MessageSquare = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
