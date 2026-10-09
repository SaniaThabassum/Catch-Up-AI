#!/usr/bin/env python3
"""
CatchUp AI Prototype Server Launcher
Launches the full-stack REST API backend (Python + Scikit-Learn + SQLite)
and serves the modern frontend application on http://localhost:8080
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

from api_server import run_server

if __name__ == "__main__":
    run_server()
