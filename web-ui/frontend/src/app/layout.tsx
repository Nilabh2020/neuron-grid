import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
      <body className={`${inter.className} bg-[#0a0a0a] text-zinc-100 min-h-screen flex overflow-hidden`}>
        <Sidebar />
        {/* Main Content */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-black">
          {children}
        </main>
      </body>
    </html>
  );
}
