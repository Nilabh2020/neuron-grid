'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, Server, Activity, ArrowUpRight, HardDrive } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-zinc-500 font-medium animate-pulse flex items-center h-full justify-center text-xl">Initializing Cluster...</div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="border-b border-zinc-800 pb-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Cluster Overview
        </h2>
        <p className="text-zinc-400 text-lg">Real-time telemetry and hardware profiling of your private AI cloud.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-xl transition-all hover:border-zinc-500">
          <div className="flex items-center space-x-3 mb-4 text-zinc-300">
            <Server size={22} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Compute Nodes</h3>
          </div>
          <div className="text-5xl font-black text-white">{stats?.online_nodes} <span className="text-zinc-600 font-medium text-3xl">/ {stats?.total_nodes}</span></div>
          <div className="mt-3 text-zinc-500 text-sm font-medium">Active instances online</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-xl transition-all hover:border-zinc-500">
          <div className="flex items-center space-x-3 mb-4 text-zinc-300">
            <HardDrive size={22} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Global VRAM / RAM</h3>
          </div>
          <div className="text-5xl font-black text-white">
            {stats?.nodes?.reduce((acc: any, n: any) => acc + (n.ram_gb || 0), 0).toFixed(1)} 
            <span className="text-zinc-600 font-medium text-3xl"> GB</span>
          </div>
          <div className="mt-3 text-zinc-500 text-sm font-medium">Total pool capacity</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-xl transition-all hover:border-zinc-500">
          <div className="flex items-center space-x-3 mb-4 text-zinc-300">
            <Activity size={22} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Cluster Status</h3>
          </div>
          <div className="text-5xl font-black text-white">Stable</div>
          <div className="mt-3 text-zinc-500 text-sm font-medium">Heartbeat frequency: 10s</div>
        </div>
      </div>

      {/* Node List */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6 flex items-center space-x-4">
          <span className="text-white">Heterogeneous Devices</span>
          <div className="h-px flex-1 bg-zinc-800 rounded-full" />
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats?.nodes?.map((node: any) => (
            <div key={node.node_id} className="group relative bg-[#111] border border-zinc-800 p-7 rounded-2xl hover:border-zinc-500 transition-all shadow-2xl shadow-black">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-xl font-bold text-white">{node.hostname}</h4>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${node.status === 'online' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      {node.status}
                    </div>
                  </div>
                  <p className="text-zinc-500 text-sm font-mono">{node.ip_address} • {node.os}</p>
                </div>
                {node._compute_score && (
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{node._compute_score}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Compute Score</div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* GPU Info Section */}
                {node.gpu_info && node.gpu_info.length > 0 ? (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-3 flex items-center space-x-2"><Cpu size={14}/> <span>Detected GPUs</span></div>
                    <div className="space-y-2">
                      {node.gpu_info.map((gpu: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-zinc-300">{gpu.name}</span>
                          <span className="font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded">{gpu.vram_mb} MB VRAM</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 flex items-center justify-center text-zinc-600 text-sm italic">
                    No discrete GPU detected (CPU Only)
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/30">
                    <div className="text-zinc-500 text-xs mb-1 uppercase tracking-wider font-bold">Logical Cores</div>
                    <div className="font-bold text-zinc-200">{node.cpu_cores} Threads</div>
                  </div>
                  <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/30">
                    <div className="text-zinc-500 text-xs mb-1 uppercase tracking-wider font-bold">System Memory</div>
                    <div className="font-bold text-zinc-200">{node.ram_gb} GB RAM</div>
                  </div>
                </div>
              </div>
              
              <ArrowUpRight className="absolute top-7 right-7 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" size={24} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

