@echo off
title NeuronGrid Peer Node
color 0A
echo.
echo  ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██╗
echo  ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║
echo  ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║
echo  ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║╚██╗██║
echo  ██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║
echo  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo  PEER MODE - Mesh Cluster Node
echo  ════════════════════════════════════════════════════════
echo.
echo  This node can be MASTER or WORKER automatically!
echo.
echo  • Runs full stack (Orchestrator + Worker + UI)
echo  • Auto-discovers other peers on LAN
echo  • Shares compute and models
echo  • Access UI: http://localhost:3000
echo.
echo  ════════════════════════════════════════════════════════
echo.

node cli.js peer
