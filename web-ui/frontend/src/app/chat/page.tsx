'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles, Loader2, Plus } from 'lucide-react';
import { marked } from 'marked';

export default function ChatPlayground() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('');
  const [localModels, setLocalModels] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
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
      const title = res.data.choices[0].message.content.replace(/["']/g, '').trim();
      
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
          content: '⚠️ **Connection Error**\n\nCould not reach the AI cluster. Please check:\n- Orchestrator is running (port 8000)\n- Model runner is active\n- Model is loaded' 
        }]);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';
      let isFirstToken = true;

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
                    const token = json.choices[0].delta?.content || '';
                    if (token) {
                        if (isFirstToken) {
                            setLoading(false);
                            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
                            isFirstToken = false;
                        }
                        assistantContent += token;
                        
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                            return updated;
                        });
                    }
                } catch (e) {
                    // Ignore incomplete JSON
                }
            }
        }
      }
    } catch (err) {
      setLoading(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ **Error**\n\nFailed to connect to the cluster. Make sure all services are running:\n```\nneurongrid start\n```' 
      }]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    const newId = Date.now().toString();
    setChatId(newId);
    inputRef.current?.focus();
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Playground</h1>
              <p className="text-xs text-zinc-500">Powered by your cluster</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 transition-colors"
            >
              {localModels.length === 0 && <option value="">No models</option>}
              {localModels.map((m, i) => (
                <option key={i} value={m.filename}>{m.name}</option>
              ))}
            </select>
            
            <button
              onClick={clearChat}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="New chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Start a conversation</h2>
              <p className="text-zinc-500 max-w-md">Ask anything and your local AI cluster will respond instantly.</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div 
                    className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} 
                  />
                )}
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-zinc-400" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  <span className="text-sm text-zinc-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:border-zinc-600 transition-colors">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message your AI cluster..."
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-white placeholder-zinc-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading || !model}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim() || !model}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2.5 rounded-lg transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-xs text-zinc-600 text-center mt-2">Press Enter to send • Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
