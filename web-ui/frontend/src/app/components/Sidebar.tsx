'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, HardDrive, Database, MessageSquare, Settings, Plus, MessageCircle, Trash2, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<{id: string, title: string}[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const loadChats = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/chats');
      console.log('Loaded chats:', res.data);
      setChats(res.data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  useEffect(() => {
    loadChats();
    
    const handleChatActive = (e: any) => setActiveChat(e.detail);
    
    window.addEventListener('chats_updated', loadChats);
    window.addEventListener('chats_loaded', (e: any) => setChats(e.detail));
    window.addEventListener('chat_active', handleChatActive);
    
    return () => {
      window.removeEventListener('chats_updated', loadChats);
      window.removeEventListener('chats_loaded', (e: any) => setChats(e.detail));
      window.removeEventListener('chat_active', handleChatActive);
    };
  }, []);

  const handleNewChat = () => {
    setActiveChat(null);
    window.dispatchEvent(new CustomEvent('new_chat_clicked'));
    router.push('/chat');
  };

  const handleLoadChat = (id: string) => {
    setActiveChat(id);
    window.dispatchEvent(new CustomEvent('load_chat_clicked', { detail: id }));
    if (pathname !== '/chat') {
      router.push('/chat');
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await axios.delete(`http://localhost:3001/api/chats/${id}`);
      if (activeChat === id) {
        setActiveChat(null);
      }
      loadChats();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 border-r border-zinc-800 flex flex-col p-6 space-y-8 bg-zinc-950/50 backdrop-blur-xl shrink-0"
    >
      <div className="flex items-center space-x-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black">
          <Network size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">NeuronGrid</h1>
      </div>

      <nav className="flex-1 flex flex-col overflow-hidden space-y-1">
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-1 shrink-0"
        >
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link href="/" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <LayoutDashboard size={20} />
                <span>Cluster Overview</span>
              </Link>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link href="/local-models" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/local-models' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <HardDrive size={20} />
                <span>Local Models</span>
              </Link>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link href="/models" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/models' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <Database size={20} />
                <span>Model Library</span>
              </Link>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link href="/chat" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/chat' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
                <MessageSquare size={20} />
                <span>Playground</span>
              </Link>
            </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="pt-8 pb-2 shrink-0 flex items-center justify-between px-3"
        >
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Chats
            </div>
            <button onClick={handleNewChat} className="text-zinc-400 hover:text-white transition-colors" title="New Chat">
                <Plus size={14} />
            </button>
        </motion.div>
        
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {chats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-400 italic font-medium">No recent chats</div>
            ) : (
                <div className="space-y-2">
                  {chats.map(chat => {
                    const isActive = activeChat === chat.id;
                    return (
                      <div 
                          key={chat.id} 
                          onClick={() => handleLoadChat(chat.id)}
                          style={{ 
                            backgroundColor: isActive ? '#ffffff' : 'transparent', 
                            color: isActive ? '#000000' : '#a1a1aa', 
                            border: '1px solid', 
                            borderColor: isActive ? '#ffffff' : '#18181b',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            marginBottom: '4px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = '#18181b';
                              e.currentTarget.style.borderColor = '#27272a';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = '#18181b';
                              e.currentTarget.style.color = '#a1a1aa';
                            }
                          }}
                      >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <MessageCircle size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} />
                              <span style={{ 
                                fontSize: '12px', 
                                fontWeight: isActive ? 700 : 500, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                lineHeight: '1.4',
                                letterSpacing: '-0.01em'
                              }}>{chat.title}</span>
                          </div>
                          <button
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              style={{ 
                                padding: '4px',
                                borderRadius: '6px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: isActive ? '#71717a' : '#3f3f46',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isActive ? 'rgba(0,0,0,0.05)' : '#27272a';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = isActive ? '#71717a' : '#3f3f46';
                              }}
                              title="Delete chat"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>
                    );
                  })}
                </div>
            )}
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-zinc-800 shrink-0">
        <Link href="/settings" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/settings' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #3f3f46;
        }
      `}} />
    </motion.div>
  );
}
