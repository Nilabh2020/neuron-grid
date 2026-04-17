'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles } from 'lucide-react';

export default function ChatPlayground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('llama-3-8b.gguf');

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3001/api/chat', {
        model: model,
        messages: newMessages,
        stream: false
      });
      
      setMessages([...newMessages, { role: 'assistant', content: res.data.content }]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages([...newMessages, { role: 'assistant', content: "Error: Failed to reach cluster." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-1 flex items-center space-x-2">
            <Sparkles className="text-zinc-400" />
            <span>AI Playground</span>
          </h2>
          <p className="text-zinc-500">Test your cluster's inference power.</p>
        </div>
        <select 
          value={model} 
          onChange={(e) => setModel(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-white transition-colors"
        >
          <option value="llama-3-8b.gguf">Llama 3 8B (GGUF)</option>
          <option value="mistral-7b.gguf">Mistral 7B (GGUF)</option>
        </select>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-24 pr-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p className="text-xl font-medium italic">"Tell me a story about a decentralized AI cluster..."</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white text-black' : 'bg-zinc-800 border border-zinc-700'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-zinc-400" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-zinc-900 border border-zinc-800 text-zinc-200'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl w-32" />
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-12 left-[340px] right-24 max-w-5xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-2 pr-4 shadow-2xl">
            <input
              type="text"
              placeholder="Message your cluster..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-white placeholder-zinc-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200 p-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-white/10"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-zinc-600 mt-3 uppercase tracking-[0.2em] font-bold">
          Powered by NeuronGrid Orchestrator • Running via llama.cpp
        </p>
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
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
