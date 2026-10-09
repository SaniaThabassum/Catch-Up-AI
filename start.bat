@echo off
title CatchUp AI - Full-Stack Local Server
echo ===================================================================
echo   CatchUp AI - "What Did I Miss?" Local-First Chat Intelligence
echo ===================================================================
echo   Starting Python REST API (Scikit-Learn ML + SQLite 3)...
echo   Serving at: http://localhost:8080
echo   Zero Cloud Egress - 100%% Local-First Processing
echo ===================================================================

start "" "http://localhost:8080"
python server.py
pause
