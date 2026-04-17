'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, Server, Activity, ArrowUpRight } from 'lucide-react';

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

  if (loading) return <div className="text-zinc-500 font-medium animate-pulse">Initializing Cluster...</div>;

  return (
    <div className="space-y-8 max-w-7xl">
      <header>
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-2">
          Cluster Overview
        </h2>
        <p className="text-zinc-400 text-lg">Real-time status of your private AI cloud.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl shadow-xl shadow-indigo-500/5 transition-all hover:border-indigo-500/30">
          <div className="flex items-center space-x-3 mb-4 text-indigo-400">
            <Server size={24} />
            <h3 className="font-semibold">Compute Nodes</h3>
          </div>
          <div className="text-4xl font-black">{stats?.online_nodes} <span className="text-zinc-500 font-medium">/ {stats?.total_nodes}</span></div>
          <div className="mt-2 text-zinc-500 text-sm">Active instances online</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl shadow-xl shadow-pink-500/5 transition-all hover:border-pink-500/30">
          <div className="flex items-center space-x-3 mb-4 text-pink-400">
            <Cpu size={24} />
            <h3 className="font-semibold">Global RAM</h3>
          </div>
          <div className="text-4xl font-black">
            {stats?.nodes?.reduce((acc: any, n: any) => acc + (n.ram_gb || 0), 0).toFixed(1)} 
            <span className="text-zinc-500 font-medium"> GB</span>
          </div>
          <div className="mt-2 text-zinc-500 text-sm">Total pool capacity</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl shadow-xl shadow-green-500/5 transition-all hover:border-green-500/30">
          <div className="flex items-center space-x-3 mb-4 text-green-400">
            <Activity size={24} />
            <h3 className="font-semibold">Node Status</h3>
          </div>
          <div className="text-4xl font-black">Stable</div>
          <div className="mt-2 text-zinc-500 text-sm">Heartbeat frequency: 10s</div>
        </div>
      </div>

      {/* Node List */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <span>Connected Devices</span>
          <div className="h-1 flex-1 bg-zinc-800 ml-4 rounded-full" />
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stats?.nodes?.map((node: any) => (
            <div key={node.node_id} className="group relative bg-zinc-950/50 border border-zinc-800 p-6 rounded-2xl hover:bg-zinc-900/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold">{node.hostname}</h4>
                  <p className="text-zinc-500 text-sm font-mono">{node.ip_address}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${node.status === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {node.status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-zinc-800 pt-6">
                <div>
                  <div className="text-zinc-500 text-xs mb-1 uppercase tracking-tighter">Cores</div>
                  <div className="font-bold">{node.cpu_cores} Threads</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs mb-1 uppercase tracking-tighter">Memory</div>
                  <div className="font-bold">{node.ram_gb} GB</div>
                </div>
              </div>
              <ArrowUpRight className="absolute bottom-6 right-6 text-zinc-700 group-hover:text-indigo-400 transition-colors" size={24} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
