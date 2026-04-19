'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, Server, Activity, ArrowUpRight, HardDrive, User, Users, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSolo, setIsSolo] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/cluster/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredNodes = isSolo && stats?.nodes && stats.nodes.length > 0
    ? [stats.nodes[0]] 
    : stats?.nodes || [];

  if (loading) return (
    <div className="min-h-full bg-black flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-t-white border-zinc-800 rounded-full animate-spin"></div>
      <div className="text-zinc-500 font-bold tracking-[0.3em] uppercase text-xs animate-pulse">
        NeuronGrid Engine Initializing...
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-[#050505] text-white selection:bg-white selection:text-black">
      <div className="max-w-[1600px] mx-auto px-8 py-12 space-y-12">
        
        {/* Top Product Bar */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-8">
          <div className="flex items-center space-x-6">
            <div className="bg-white text-black p-3 rounded-xl">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">NeuronGrid</h1>
                <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">Enterprise Edition</span>
              </div>
              <p className="text-zinc-500 text-sm font-bold tracking-tight">Advanced Local Neural Orchestration Engine</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="text-right">
              <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1 italic">License Status</div>
              <div className="text-white font-black text-sm flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>PROFESSIONAL (V1.0)</span>
              </div>
            </div>
            <div className="h-10 w-px bg-zinc-900"></div>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 shadow-2xl">
              <button 
                onClick={() => setIsSolo(true)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${isSolo ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:text-white'}`}
              >
                <User size={14} />
                <span>Solo</span>
              </button>
              <button 
                onClick={() => setIsSolo(false)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${!isSolo ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:text-white'}`}
              >
                <Users size={14} />
                <span>Team</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-black border border-zinc-800/50 p-12 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-12 overflow-hidden">
             <div className="z-10 space-y-4">
               <h2 className="text-6xl font-black tracking-tighter leading-none">
                {isSolo ? 'LOCAL CORE' : 'CLOUD CLUSTER'}
               </h2>
               <p className="text-zinc-500 text-xl font-medium max-w-xl leading-relaxed">
                 {isSolo 
                   ? "Secure, single-node inference utilizing dedicated silicon and local VRAM. Zero data egress." 
                   : "Distributed inference architecture spanning multiple heterogeneous compute nodes."}
               </p>
               <div className="flex items-center space-x-4 pt-4">
                 <div className="flex -space-x-3">
                   {[1,2,3].map(i => <div key={i} className="w-10 h-10 border-4 border-black bg-zinc-900 rounded-full flex items-center justify-center text-[10px] font-black">AI</div>)}
                 </div>
                 <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Active Models: 4 Ready</span>
               </div>
             </div>
             
             <div className="z-10 grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-zinc-950/80 border border-zinc-800 p-6 rounded-3xl min-w-[200px]">
                   <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-2">Cluster Latency</div>
                   <div className="text-4xl font-black tracking-tighter">0.04<span className="text-xs text-zinc-700 ml-1">MS</span></div>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-800 p-6 rounded-3xl min-w-[200px]">
                   <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-2">Throughput</div>
                   <div className="text-4xl font-black tracking-tighter">128<span className="text-xs text-zinc-700 ml-1">T/S</span></div>
                </div>
             </div>

             <Globe className="absolute -right-20 -bottom-20 text-zinc-900/20 w-[400px] h-[400px] pointer-events-none" />
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { label: 'Compute Nodes', val: isSolo ? '1' : stats?.online_nodes, total: isSolo ? '1' : stats?.total_nodes, icon: <Server size={24} />, desc: 'System hardware presence' },
            { label: 'Neural Memory', val: filteredNodes.reduce((acc: any, n: any) => acc + (n?.ram_gb || 0), 0).toFixed(1), unit: 'GB', icon: <HardDrive size={24} />, desc: 'Total aggregate memory' },
            { label: 'Infrastructure', val: 'NOMINAL', icon: <Activity size={24} />, desc: 'Real-time engine status' }
          ].map((card, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
              }}
              className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2rem] hover:border-zinc-500 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="flex items-center space-x-4 mb-8 text-zinc-600 group-hover:text-white transition-colors">
                {card.icon}
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">{card.label}</h3>
              </div>
              <div className="text-6xl font-black tracking-tighter group-hover:scale-[1.02] transition-transform duration-500">
                {card.val} 
                {card.total && <span className="text-zinc-800 font-bold text-3xl ml-2 tracking-normal">/ {card.total}</span>}
                {card.unit && <span className="text-zinc-800 font-bold text-3xl ml-2 tracking-normal">{card.unit}</span>}
              </div>
              <div className="mt-4 text-zinc-600 text-xs font-bold italic tracking-tight">{card.desc}</div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <ArrowUpRight size={48} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Node Inventory */}
        <div className="space-y-8 pb-20">
          <div className="flex items-center space-x-6">
            <h3 className="text-2xl font-black tracking-tight uppercase italic">Hardware Inventory</h3>
            <div className="h-px flex-1 bg-zinc-900"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredNodes.map((node: any) => (
              <div key={node.node_id} className="group bg-black border border-zinc-900 p-10 rounded-[2.5rem] hover:border-zinc-100 transition-all duration-700 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div>
                    <div className="flex items-center space-x-4 mb-3">
                      <h4 className="text-4xl font-black tracking-tighter">{node.hostname.toUpperCase()}</h4>
                      <div className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full">ACTIVE</div>
                    </div>
                    <div className="flex items-center space-x-3 text-zinc-600 font-black font-mono text-[10px] tracking-widest">
                      <span>{node.ip_address}</span>
                      <span>•</span>
                      <span>{node.os.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black tracking-tighter text-zinc-800 group-hover:text-white transition-colors">0{node.node_id}</div>
                    <div className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.2em]">Node Identifier</div>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {node.gpu_info && node.gpu_info.length > 0 ? (
                    <div className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-900 group-hover:border-zinc-800 transition-all">
                      <div className="flex items-center space-x-3 mb-6">
                        <Cpu size={16} className="text-zinc-700" />
                        <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest italic">Inference Accelerators</span>
                      </div>
                      <div className="space-y-4">
                        {node.gpu_info.map((gpu: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-900/50">
                            <span className="font-black text-xs text-zinc-400 uppercase tracking-tighter">{gpu.name}</span>
                            <span className="font-black text-sm tabular-nums text-white bg-zinc-900 px-4 py-1.5 rounded-xl border border-zinc-800">{gpu.vram_mb}MB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-900 text-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.5em] italic">
                      No Discrete Accelerator Found
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-900 group-hover:border-zinc-800 transition-all">
                      <div className="text-zinc-700 text-[9px] mb-3 uppercase tracking-widest font-black">Compute Fabric</div>
                      <div className="font-black text-2xl tracking-tighter">{node.cpu_cores} <span className="text-[10px] text-zinc-800">THREADS</span></div>
                    </div>
                    <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-900 group-hover:border-zinc-800 transition-all">
                      <div className="text-zinc-700 text-[9px] mb-3 uppercase tracking-widest font-black">Local Capacity</div>
                      <div className="font-black text-2xl tracking-tighter">{node.ram_gb} <span className="text-[10px] text-zinc-800">GB RAM</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-white/10 transition-all"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Footer */}
        <footer className="border-t border-zinc-900 pt-12 pb-20 flex flex-col md:flex-row justify-between items-center text-[10px] font-black tracking-widest text-zinc-700 uppercase gap-6">
          <div className="flex items-center space-x-6">
            <span>© 2026 NILABH ENTERPRISE</span>
            <span className="text-zinc-800">|</span>
            <span>ALL RIGHTS RESERVED</span>
          </div>
          <div className="flex items-center space-x-8">
            <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-white cursor-pointer transition-colors">Hardware Support</span>
            <span className="text-white px-4 py-2 border border-zinc-900 rounded-lg">Product ID: NG-772-NX</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

