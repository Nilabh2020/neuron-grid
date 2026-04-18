'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles, Activity, Network } from 'lucide-react';
import { marked } from 'marked';

export default function ChatPlayground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('');
  const [localModels, setLocalModels] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string>('');

  useEffect(() => {
    setChatId(Date.now().toString());

    const handleNewChat = () => {
      setMessages([]);
      setChatId(Date.now().toString());
    };
    
    const handleLoadChat = (e: any) => {
      const id = e.detail;
      const allChats = JSON.parse(localStorage.getItem('neuron_chats_data') || '{}');
      if (allChats[id]) {
        setMessages(allChats[id]);
        setChatId(id);
      }
    };

    window.addEventListener('new_chat_clicked', handleNewChat);
    window.addEventListener('load_chat_clicked', handleLoadChat);
    
    return () => {
      window.removeEventListener('new_chat_clicked', handleNewChat);
      window.removeEventListener('load_chat_clicked', handleLoadChat);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && chatId) {
      const allChats = JSON.parse(localStorage.getItem('neuron_chats_data') || '{}');
      allChats[chatId] = messages;
      localStorage.setItem('neuron_chats_data', JSON.stringify(allChats));
      
      const chatMeta = JSON.parse(localStorage.getItem('neuron_chats') || '[]');
      if (!chatMeta.find((c: any) => c.id === chatId)) {
        const title = "New Conversation";
        chatMeta.unshift({ id: chatId, title });
        localStorage.setItem('neuron_chats', JSON.stringify(chatMeta));
        window.dispatchEvent(new Event('chats_updated'));
        
        const userMsg = messages.find(m => m.role === 'user');
        if (userMsg) {
          generateChatTitle(chatId, userMsg.content);
        }
      }
    }
  }, [messages, chatId]);

  const generateChatTitle = async (id: string, text: string) => {
    try {
      const res = await axios.post('http://localhost:3001/api/chat', {
        model: model,
        messages: [{ role: 'user', content: `Summarize this prompt in 2 to 4 words. Respond ONLY with the title and nothing else. No quotes, no intro. Prompt: "${text}"` }],
        stream: false
      });
      const title = res.data.choices[0].message.content.replace(/["']/g, '').trim();
      
      const chatMeta = JSON.parse(localStorage.getItem('neuron_chats') || '[]');
      const chatIndex = chatMeta.findIndex((c: any) => c.id === id);
      if (chatIndex >= 0) {
        chatMeta[chatIndex].title = title;
        localStorage.setItem('neuron_chats', JSON.stringify(chatMeta));
        window.dispatchEvent(new Event('chats_updated'));
      }
    } catch (err) {
      console.error("Title generation failed", err);
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/local-models');
        setLocalModels(res.data);
        if (res.data.length > 0) {
          setModel(res.data[0].filename);
        }
      } catch (err) {
        console.error("Failed to fetch models for chat", err);
      }
    };
    fetchModels();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !model) return;
    
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setTelemetry("Initializing neural link...");

    try {
      const systemPrompt = { role: 'system', content: 'You are Neuron, a brilliant, direct, and concise AI running locally on an enterprise cluster. Answer the user\'s prompt immediately without any conversational filler. NEVER use greetings like "Hello" or "I am doing well". NEVER give robotic disclaimers. Go straight to the answer.' };
      const apiMessages = [systemPrompt, ...newMessages];

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          stream: true
        })
      });

      if (!response.ok) throw new Error('Failed to reach cluster');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';
      let isFirstToken = true;

      setTelemetry("Inference in progress...");

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep the last incomplete chunk in the buffer
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    const token = json.choices[0].delta?.content || '';
                    if (token) {
                        if (isFirstToken) {
                            setLoading(false);
                            isFirstToken = false;
                        }
                        assistantContent += token;
                        
                        // Update the last message in state with the new content
                        setMessages(prev => {
                            const updated = [...prev];
                            if (updated.length > 0 && updated[updated.length - 1].role === 'user') {
                                updated.push({ role: 'assistant', content: assistantContent });
                            } else {
                                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                            }
                            return updated;
                        });
                    }
                } catch (e) {
                    // Ignore incomplete JSON
                }
            }
        }
      }
      
      setTelemetry("Inference complete. Cluster nominal.");
    } catch (err) {
      console.error("Chat error", err);
      setMessages(prev => {
        const updated = [...prev];
        updated.push({ role: 'assistant', content: "Error: Failed to reach cluster or model load timeout." });
        return updated;
      });
      setTelemetry("Cluster connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh)] flex flex-col max-w-5xl mx-auto relative p-8">
      <header className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6 shrink-0">
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
            {localModels.length === 0 && <option value="">No local models found</option>}
            {localModels.map((m, i) => (
              <option key={i} value={m.filename}>{m.name} ({m.quant})</option>
            ))}
          </select>
        </div>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 pr-4 custom-scrollbar min-h-0">
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
              <div className={`p-5 rounded-2xl text-base leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-white text-black font-medium' : 'bg-[#111] border border-zinc-800 text-zinc-300 shadow-2xl shadow-black/50 prose prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800'}`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} />
                )}
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
      <div className="shrink-0 pt-6 pb-2 w-full mx-auto">
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
