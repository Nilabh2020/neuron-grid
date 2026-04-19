'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Copy, Edit2, Trash2, GitBranch, Lightbulb, Layers, Clock, Plus, Hammer, ArrowUp, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { marked } from 'marked';

export default function ChatPlayground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('');
  const [localModels, setLocalModels] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [currentContextTokens, setCurrentContextTokens] = useState<number>(0);
  const [maxContextTokens, setMaxContextTokens] = useState<number>(32768);

  const [expandedThoughts, setExpandedThoughts] = useState<{[key: number]: boolean}>({});

  const toggleThought = (index: number) => {
    setExpandedThoughts(prev => ({...prev, [index]: !prev[index]}));
  };

  const fetchModelInfo = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/model-info');
      if (res.data && res.data.n_ctx) {
        setMaxContextTokens(res.data.n_ctx);
      }
    } catch (err) {
      console.log('Could not fetch dynamic model info');
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, [model]);

  // Rest of the hooks...

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    setChatId(Date.now().toString());
    loadChatsFromBackend();

    const handleNewChat = () => {
      setMessages([]);
      const newId = Date.now().toString();
      setChatId(newId);
      if (inputRef.current) inputRef.current.focus();
    };
    
    const handleLoadChat = async (e: any) => {
      const id = e.detail;
      try {
        const res = await axios.get(`http://localhost:3001/api/chats/${id}`);
        setMessages(res.data.messages);
        setChatId(id);
        window.dispatchEvent(new CustomEvent('chat_active', { detail: id }));
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    };

    window.addEventListener('new_chat_clicked', handleNewChat);
    window.addEventListener('load_chat_clicked', handleLoadChat);
    
    return () => {
      window.removeEventListener('new_chat_clicked', handleNewChat);
      window.removeEventListener('load_chat_clicked', handleLoadChat);
    };
  }, []);

  const loadChatsFromBackend = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/chats');
      window.dispatchEvent(new CustomEvent('chats_loaded', { detail: res.data }));
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && chatId) {
      saveChatToBackend();
    }
  }, [messages, chatId]);

  const saveChatToBackend = async () => {
    if (!chatId || messages.length === 0) return;
    
    try {
      const userMsg = messages.find(m => m.role === 'user');
      const title = userMsg ? userMsg.content.slice(0, 40) + (userMsg.content.length > 40 ? '...' : '') : "New Chat";
      
      await axios.post('http://localhost:3001/api/chats/save', {
        chatId,
        messages,
        title
      });
      
      window.dispatchEvent(new CustomEvent('chats_updated'));
      window.dispatchEvent(new CustomEvent('chat_active', { detail: chatId }));
      
      if (userMsg && messages.length <= 2) {
        generateChatTitle(chatId, userMsg.content);
      }
    } catch (err) {
      console.error('Failed to save chat:', err);
    }
  };

  const generateChatTitle = async (id: string, text: string) => {
    try {
      const res = await axios.post('http://localhost:3001/api/chat', {
        model: model,
        messages: [{ role: 'user', content: `Create a short 3-5 word title for this chat. Just the title, nothing else: "${text.slice(0, 100)}"` }],
        stream: false
      });
      const content = res.data.choices[0].message.content || '';
      const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<[^>]*>?/gm, '').replace(/["']/g, '').trim();
      const title = cleanContent || "New Conversation";
      
      await axios.post('http://localhost:3001/api/chats/save', {
        chatId: id,
        messages,
        title
      });
      
      window.dispatchEvent(new CustomEvent('chats_updated'));
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
        console.error("Failed to fetch models", err);
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

    const startTime = Date.now();
    let tokenCount = 0;

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: newMessages,
          stream: true
        })
      });

      if (!response.ok) {
        setLoading(false);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          modelName: model,
          content: '⚠️ **Connection Error**\n\nCould not reach the AI cluster. Please check:\n- Orchestrator is running (port 8000)\n- Model runner is active\n- Model is loaded',
          stats: { tokPerSec: '0.00', totalTokens: 0, totalTime: '0.00', stopReason: 'Error', thoughtTime: '0.00' }
        }]);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';
      let isFirstToken = true;
      let timeToFirstToken = 0;
      let generationStartTime = 0;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    
                    // Check if this is the metrics chunk with real stats from llama.cpp
                    if (json.metrics) {
                        const metrics = json.metrics;
                        const usage = json.usage || {};
                        
                        setMessages(prev => {
                            const updated = [...prev];
                            const lastMsg = updated[updated.length - 1];
                            if (lastMsg && lastMsg.role === 'assistant') {
                                lastMsg.stats = {
                                    tokPerSec: metrics.tokens_per_sec.toFixed(2),
                                    totalTokens: usage.completion_tokens || tokenCount,
                                    totalTime: metrics.generation_time_sec.toFixed(2),
                                    stopReason: metrics.stop_reason === 'stop' ? 'EOS Token Found' : metrics.stop_reason,
                                    thoughtTime: metrics.prompt_time_sec.toFixed(2)
                                };
                            }
                            return updated;
                        });
                        continue;
                    }

                    const token = json.choices?.[0]?.delta?.content || '';
                    if (token) {
                        tokenCount++;
                        if (isFirstToken) {
                            timeToFirstToken = Date.now() - startTime;
                            generationStartTime = Date.now();
                            setLoading(false);
                            setMessages(prev => [...prev, { role: 'assistant', modelName: model, content: '', stats: {} }]);
                            isFirstToken = false;
                        }
                        assistantContent += token;
                        
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { 
                                role: 'assistant', 
                                modelName: model,
                                content: assistantContent,
                                stats: updated[updated.length - 1].stats || {}
                            };
                            return updated;
                        });
                    }
                } catch (e) {
                    // Ignore incomplete JSON
                }
            }
        }
      }
      
      // Stream complete - metrics already set by backend
    } catch (err) {
      setLoading(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        modelName: model,
        content: '❌ **Error**\n\nFailed to connect to the cluster. Make sure all services are running:\n```\nneurongrid start\n```',
        stats: { tokPerSec: '0.00', totalTokens: 0, totalTime: '0.00', stopReason: 'Error', thoughtTime: '0.00' }
      }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const reloadModel = () => {
    // Placeholder for model reload logic
    console.log("Reloading model:", model);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const parseContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    let thought = '';
    let main = content;

    if (thinkMatch) {
      thought = thinkMatch[1].trim();
      main = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/, '').trim();
    }

    return { thought, main };
  };

  return (
    <div className="h-screen flex flex-col bg-[#121212] text-[#e0e0e0] font-sans selection:bg-[#2a2a2a] selection:text-white">
      
      {/* Header */}
      <div className="border-b border-zinc-900 bg-[#121212] sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight text-white">AI Playground</h1>
            <span className="text-xs text-zinc-500">Powered by your cluster</span>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="bg-[#1a1a1a] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-zinc-600 transition-colors cursor-pointer"
            >
              {localModels.length === 0 && <option value="">No models detected</option>}
              {localModels.map((m, i) => (
                <option key={i} value={m.filename}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="max-w-[850px] mx-auto px-6 py-8 space-y-10 flex flex-col">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            </div>
          )}
          
          {messages.map((msg, i) => {
            const { thought, main } = msg.role === 'assistant' ? parseContent(msg.content) : { thought: '', main: msg.content };
            
            return (
              <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'user' ? (
                   <div className="bg-[#232323] text-[#e0e0e0] px-5 py-3 rounded-3xl max-w-[70%]">
                     <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{main}</p>
                   </div>
                ) : (
                  <div className="flex flex-col max-w-[100%] space-y-3 w-full">
                    {/* Model Name */}
                    <div className="text-[13px] text-zinc-400 font-medium tracking-tight">
                      {msg.modelName ? msg.modelName.replace('.gguf', '') : (model ? model.replace('.gguf', '') : 'assistant')}
                    </div>
                    
                    {/* Thought Process (Collapsible) */}
                    {(msg.stats?.thoughtTime || thought) && (
                      <div className="group -ml-1">
                        <button 
                          onClick={() => toggleThought(i)}
                          className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-300 transition-colors text-[14px] mb-1 px-1 py-0.5 rounded-md"
                        >
                          {expandedThoughts[i] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className="font-medium">Thought Process {msg.stats?.thoughtTime ? `(${msg.stats.thoughtTime}s)` : ''}</span>
                        </button>
                        {expandedThoughts[i] && (
                           <div className="pl-6 border-l-2 border-zinc-800 text-zinc-500 text-[14px] mb-4 py-1 ml-1 font-medium whitespace-pre-wrap">
                             {thought || 'Internal thought process data not currently streamed by engine.'}
                           </div>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    {main && (
                      <div 
                        className="text-[15px] leading-relaxed text-[#e0e0e0] prose prose-invert max-w-none prose-p:my-2 prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-zinc-800/30 prose-pre:rounded-xl prose-code:text-zinc-300 font-medium"
                        dangerouslySetInnerHTML={{ __html: marked.parse(main) as string }} 
                      />
                    )}

                    {/* Stats Pills Row */}
                    {msg.stats && msg.stats.tokPerSec && (
                      <div className="flex flex-wrap items-center gap-2 pt-3">
                         <div className="flex items-center space-x-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md text-[12px] text-zinc-400 font-medium border border-zinc-800/30">
                            <Lightbulb size={12} />
                            <span>{msg.stats.tokPerSec} tok/sec</span>
                         </div>
                         <div className="flex items-center space-x-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md text-[12px] text-zinc-400 font-medium border border-zinc-800/30">
                            <Layers size={12} />
                            <span>{msg.stats.totalTokens} tokens</span>
                         </div>
                         <div className="flex items-center space-x-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md text-[12px] text-zinc-400 font-medium border border-zinc-800/30">
                            <Clock size={12} />
                            <span>{msg.stats.totalTime}s</span>
                         </div>
                         <div className="bg-[#1a1a1a] px-2.5 py-1 rounded-md text-[12px] text-zinc-400 font-medium border border-zinc-800/30">
                            <span>Stop: {msg.stats.stopReason}</span>
                         </div>
                      </div>
                    )}

                    {/* Action Icons Row */}
                    <div className="flex items-center space-x-4 pt-2 pb-2 text-zinc-500">
                      <button className="hover:text-zinc-300 transition-colors p-1"><GitBranch size={16} /></button>
                      <button onClick={() => copyToClipboard(main)} className="hover:text-zinc-300 transition-colors p-1"><Copy size={16} /></button>
                      <button className="hover:text-zinc-300 transition-colors p-1"><Edit2 size={16} /></button>
                      <button className="hover:text-zinc-300 transition-colors p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex w-full justify-start">
               <div className="flex flex-col max-w-[100%] space-y-3 w-full">
                  <div className="text-[13px] text-zinc-400 font-medium tracking-tight">
                    {model ? model.replace('.gguf', '') : 'assistant'}
                  </div>
                  <div className="flex items-center space-x-3 text-zinc-400 text-[14px] font-medium pt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" style={{animationDelay: '150ms'}}></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" style={{animationDelay: '300ms'}}></div>
                  </div>
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="w-full flex justify-center pb-8 pt-4 bg-[#121212]">
        <div className="max-w-[850px] w-full px-6 flex flex-col items-center">
          
          {/* Reload Model Button */}
          <button 
             onClick={reloadModel}
             className="flex items-center space-x-2 bg-[#232323] hover:bg-[#2a2a2a] text-zinc-400 hover:text-zinc-300 px-4 py-1.5 rounded-xl text-[12px] font-medium transition-colors mb-4"
          >
             <RefreshCw size={12} />
             <span>Reload last used model</span>
             <span className="text-zinc-500 ml-1">(Ctrl + R)</span>
          </button>

          {/* Input Box */}
          <div className="w-full bg-[#1e1e1e] rounded-[24px] p-3 flex flex-col transition-colors border border-transparent focus-within:border-zinc-800">
             
             <textarea
                ref={inputRef}
                placeholder="Send a message to the model..."
                className="w-full bg-transparent border-none outline-none text-[15px] text-[#e0e0e0] placeholder-zinc-500 resize-none max-h-[250px] min-h-[48px] overflow-y-auto custom-scrollbar px-3 pt-3 pb-1 font-medium"
                value={input}
                onChange={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                disabled={loading || !model}
                rows={1}
             />

             <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center space-x-2 text-zinc-400">
                   <button className="hover:text-zinc-200 hover:bg-[#2a2a2a] rounded-full p-2 transition-colors"><Plus size={18} /></button>
                   <button className="hover:text-zinc-200 hover:bg-[#2a2a2a] rounded-full p-2 transition-colors"><Hammer size={18} /></button>
                </div>
                
                <div className="flex items-center space-x-4 pr-1">
                   <div className="text-[11px] text-zinc-500 font-medium">
                      {currentContextTokens}/{maxContextTokens}
                   </div>
                   <button 
                     onClick={() => {
                        sendMessage();
                        if (inputRef.current) inputRef.current.style.height = 'auto';
                     }}
                     disabled={loading || !input.trim() || !model}
                     className="bg-[#2a2a2a] disabled:bg-[#1a1a1a] hover:bg-[#3a3a3a] disabled:text-zinc-700 text-zinc-300 w-9 h-9 rounded-full transition-colors flex items-center justify-center"
                   >
                     <ArrowUp size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #2a2a2a;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #3a3a3a;
        }
      `}</style>
    </div>
  );
}
