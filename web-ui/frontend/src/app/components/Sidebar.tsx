'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, HardDrive, Database, MessageSquare, Settings, Plus, MessageCircle } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<{id: string, title: string}[]>([]);

  const loadChats = () => {
    const saved = JSON.parse(localStorage.getItem('neuron_chats') || '[]');
    setChats(saved);
  };

  useEffect(() => {
    loadChats();
    window.addEventListener('chats_updated', loadChats);
    return () => window.removeEventListener('chats_updated', loadChats);
  }, []);

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent('new_chat_clicked'));
    router.push('/chat');
  };

  const handleLoadChat = (id: string) => {
    window.dispatchEvent(new CustomEvent('load_chat_clicked', { detail: id }));
    router.push('/chat');
  };

  return (
    <div className="w-64 border-r border-zinc-800 flex flex-col p-6 space-y-8 bg-zinc-950/50 backdrop-blur-xl shrink-0">
      <div className="flex items-center space-x-2 px-2">
        <div className="w-8 h-8 bg-gradient-to-tr from-zinc-400 to-zinc-700 rounded-lg shadow-lg shadow-white/10" />
        <h1 className="text-xl font-bold tracking-tight text-white">NeuronGrid</h1>
      </div>

      <nav className="flex-1 flex flex-col overflow-hidden space-y-1">
        <div className="space-y-1 shrink-0">
            <Link href="/" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
              <LayoutDashboard size={20} />
              <span>Cluster Overview</span>
            </Link>
            <Link href="/local-models" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/local-models' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
              <HardDrive size={20} />
              <span>Local Models</span>
            </Link>
            <Link href="/models" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/models' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
              <Database size={20} />
              <span>Model Library</span>
            </Link>
            <Link href="/chat" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/chat' ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}>
              <MessageSquare size={20} />
              <span>Playground</span>
            </Link>
        </div>

        <div className="pt-8 pb-2 shrink-0 flex items-center justify-between px-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Chats
            </div>
            <button onClick={handleNewChat} className="text-zinc-400 hover:text-white transition-colors" title="New Chat">
                <Plus size={14} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
            {chats.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-600 italic font-medium">No recent chats</div>
            ) : (
                chats.map(chat => (
                    <div 
                        key={chat.id} 
                        onClick={() => handleLoadChat(chat.id)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800/50 cursor-pointer transition-all group"
                    >
                        <MessageCircle size={14} className="shrink-0" />
                        <span className="text-sm font-medium truncate group-hover:text-white transition-colors">{chat.title}</span>
                    </div>
                ))
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
    </div>
  );
}
