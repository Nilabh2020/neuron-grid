'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Cpu, Network, Database, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const [orchestratorUrl, setOrchestratorUrl] = useState('http://localhost:8000');
  const [modelManagerUrl, setModelManagerUrl] = useState('http://localhost:8002');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, you'd save these to backend/config
    localStorage.setItem('orchestrator_url', orchestratorUrl);
    localStorage.setItem('model_manager_url', modelManagerUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    const savedOrch = localStorage.getItem('orchestrator_url');
    const savedMM = localStorage.getItem('model_manager_url');
    if (savedOrch) setOrchestratorUrl(savedOrch);
    if (savedMM) setModelManagerUrl(savedMM);
  }, []);

  return (
    <div className="h-screen flex flex-col max-w-5xl mx-auto p-8">
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center space-x-3">
          <SettingsIcon className="text-zinc-400" size={32} />
          <span>Settings</span>
        </h2>
        <p className="text-zinc-500 text-lg">Configure your NeuronGrid cluster</p>
      </header>

      <div className="space-y-6">
        {/* Cluster Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Server size={20} className="text-zinc-400" />
            <h3 className="text-xl font-bold text-white">Cluster Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Orchestrator URL
              </label>
              <input
                type="text"
                value={orchestratorUrl}
                onChange={(e) => setOrchestratorUrl(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors"
                placeholder="http://localhost:8000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Model Manager URL
              </label>
              <input
                type="text"
                value={modelManagerUrl}
                onChange={(e) => setModelManagerUrl(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors"
                placeholder="http://localhost:8002"
              />
            </div>
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Cpu size={20} className="text-zinc-400" />
            <h3 className="text-xl font-bold text-white">System Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-1">Version</div>
              <div className="text-lg font-bold text-white">1.0.1</div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-1">Mode</div>
              <div className="text-lg font-bold text-white">Master Node</div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-1">Backend</div>
              <div className="text-lg font-bold text-white">Node.js</div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-1">Frontend</div>
              <div className="text-lg font-bold text-white">Next.js</div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleSave}
            className="w-full bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-3 shadow-lg"
          >
            <Save size={20} />
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
