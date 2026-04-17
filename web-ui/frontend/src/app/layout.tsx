import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Cpu, MessageSquare, Settings, Database } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuronGrid Dashboard",
  description: "Private Local AI Cloud Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-zinc-100 min-h-screen flex`}>
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 flex flex-col p-6 space-y-8 bg-zinc-950/50 backdrop-blur-xl">
          <div className="flex items-center space-x-2 px-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-zinc-400 to-zinc-700 rounded-lg shadow-lg shadow-white/10" />
            <h1 className="text-xl font-bold tracking-tight text-white">NeuronGrid</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <Link href="/" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium">
              <LayoutDashboard size={20} />
              <span>Cluster Overview</span>
            </Link>
            <Link href="/nodes" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-400 hover:text-white">
              <Cpu size={20} />
              <span>Nodes</span>
            </Link>
            <Link href="/models" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-400 hover:text-white">
              <Database size={20} />
              <span>Model Library</span>
            </Link>
            <Link href="/chat" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-400 hover:text-white">
              <MessageSquare size={20} />
              <span>Playground</span>
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-800">
            <Link href="/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all text-zinc-400 hover:text-white">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
