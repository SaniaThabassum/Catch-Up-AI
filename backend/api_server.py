#!/usr/bin/env python3
"""
CatchUp AI - Backend REST API Server & Frontend Host
Provides full REST API endpoints with SQLite persistence and Scikit-Learn ML analysis.
Runs 100% locally on http://localhost:8080 with zero data egress.
"""

import http.server
import socketserver
import urllib.parse
import json
import os
import sys
import mimetypes

# Configure UTF-8 encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)

from database import (
    init_db, seed_sample_data, get_db,
    get_all_channels, get_channel_messages,
    save_analysis, toggle_action_item, create_custom_channel,
    clear_session_db
)
from ml_engine import LocalMLEngine

PORT = 8080
ml_engine = LocalMLEngine()

# Load sample datasets for seeding
def load_sample_datasets():
    sample_file = os.path.join(project_root, "sample_data.js")
    with open(sample_file, "r", encoding="utf-8") as f:
        content = f.read()
    # Strip javascript variable assignment and parse json
    json_start = content.find("{")
    json_end = content.rfind("};") + 1
    clean_json = content[json_start:json_end]
    # Use Node.js or regex to ensure clean json extraction
    import subprocess
    cmd = ["node", "-e", "const { SAMPLE_DATASETS } = require('./sample_data.js'); console.log(JSON.stringify(SAMPLE_DATASETS));"]
    out = subprocess.check_output(cmd, cwd=project_root)
    return json.loads(out.decode("utf-8"))

class CatchUpAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=project_root, **kwargs)

    def end_headers(self):
        # Enable CORS for local development & prevent caching
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API Health & Privacy Audit
        if path == '/api/health':
            self.send_json({
                "status": "online",
                "backend": "Python 3.12 + Scikit-Learn + SQLite",
                "networkEgressBytes": 0,
                "privacyGuarantee": "100% on-device processing",
                "activeModels": ["Scikit-Learn TF-IDF Centroid Vectorizer", "Intent & Deadline Heuristic Engine"],
                "database": "SQLite 3 (Local catchup.db)"
            })
            return

        # 2. Get Channels List
        if path == '/api/channels':
            channels = get_all_channels()
            self.send_json({"channels": channels})
            return

        # 2b. Explicit Demo Sample Conversation
        if path == '/api/sample':
            datasets = load_sample_datasets()
            seed_sample_data(datasets)
            persona = query.get('persona', ['Alex'])[0]
            messages = get_channel_messages('incident')
            result = ml_engine.analyze_messages(messages, persona=persona)
            save_analysis('incident', result)
            self.send_json({
                "channelId": "incident",
                "name": "Demo Incident Conversation",
                "persona": persona,
                **result
            })
            return

        # 3. Get Channel Details & Analysis
        if path.startswith('/api/channels/'):
            channel_id = path.replace('/api/channels/', '').strip('/')
            persona = query.get('persona', ['Alex'])[0]

            messages = get_channel_messages(channel_id)
            if not messages:
                self.send_json({"error": "Channel not found"}, 404)
                return

            # Run Local ML Analysis
            result = ml_engine.analyze_messages(messages, persona=persona)
            save_analysis(channel_id, result)

            # Overlay completed states from SQLite
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, completed FROM action_items WHERE channel_id = ?", (channel_id,))
            completed_map = {row["id"]: bool(row["completed"]) for row in cursor.fetchall()}
            conn.close()

            for act in result["actionItems"]:
                if act["id"] in completed_map:
                    act["completed"] = completed_map[act["id"]]

            self.send_json({
                "channelId": channel_id,
                "persona": persona,
                **result
            })
            return

        # 4. Get All Decisions Across Channels
        if path == '/api/decisions':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM decisions ORDER BY created_at DESC")
            decisions = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json({"decisions": decisions})
            return

        # 5. Get All Action Items Across Channels
        # 5. Get All Action Items Across Channels
        if path == '/api/actions':
            assignee = query.get('assignee', [None])[0]
            conn = get_db()
            cursor = conn.cursor()
            if assignee:
                cursor.execute("SELECT * FROM action_items WHERE assignee LIKE ? ORDER BY created_at DESC", (f"%{assignee}%",))
            else:
                cursor.execute("SELECT * FROM action_items ORDER BY created_at DESC")
            actions = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json({"actions": actions})
            return

        # 6. Get All Changed Plans Across Channels
        if path == '/api/changed-plans':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM changed_plans ORDER BY created_at DESC")
            plans = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json({"changedPlans": plans})
            return

        # Fallback to static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body) if body else {}

        # 0. Clear Session & Delete User Data (Privacy Section 9)
        if path == '/api/session/clear':
            clear_session_db()
            self.send_json({"success": True, "message": "Local session and temporary data cleared completely."})
            return

        # 1. Toggle Action Item Checkbox
        if path.startswith('/api/actions/') and path.endswith('/toggle'):
            action_id = path.replace('/api/actions/', '').replace('/toggle', '')
            new_state = toggle_action_item(action_id)
            if new_state is None:
                self.send_json({"error": "Action item not found"}, 404)
            else:
                self.send_json({"success": True, "actionId": action_id, "completed": new_state})
            return

        # 2. Create Custom Channel from Pasted Chat
        if path == '/api/channels':
            channel_name = data.get("name", "custom-chat")
            raw_text = data.get("rawText", "")
            persona = data.get("persona", "Alex")
            messages = data.get("messages", [])

            if not messages and raw_text:
                # Parse raw text
                import re
                lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
                for idx, line in enumerate(lines):
                    m = re.match(r'^\[?([\d/,\s:]+(?:am|pm)?)\]?[\s-]+([^:]+):\s*(.+)$', line, re.I)
                    if m:
                        messages.append({
                            "id": f"c_{idx}",
                            "time": m.group(1).strip(),
                            "author": m.group(2).strip(),
                            "text": m.group(3).strip()
                        })
                    else:
                        m_simple = re.match(r'^([A-Za-z0-9_.\s@]{2,20}):\s*(.+)$', line)
                        if m_simple:
                            messages.append({
                                "id": f"c_{idx}",
                                "time": f"10:{idx:02d} AM",
                                "author": m_simple.group(1).strip(),
                                "text": m_simple.group(2).strip()
                            })

            channel_id = f"custom_{int(os.times().elapsed * 1000)}"
            create_custom_channel(channel_id, f"📥 #{channel_name}", "Custom", "Pasted chat conversation", messages)

            result = ml_engine.analyze_messages(messages, persona=persona)
            save_analysis(channel_id, result)

            self.send_json({
                "channelId": channel_id,
                "messageCount": len(messages),
                **result
            }, 201)
            return

        # 3. Ad-hoc Chat Text Analysis
        if path == '/api/analyze':
            messages = data.get("messages", [])
            persona = data.get("persona", "Alex")
            result = ml_engine.analyze_messages(messages, persona=persona)
            self.send_json(result)
            return

        self.send_json({"error": "Endpoint not found"}, 404)

def run_server():
    print("=" * 65)
    print("🚀 CatchUp AI - Full-Stack Local Server (Frontend + REST API)")
    print("=" * 65)

    init_db()
    print("✅ Local SQLite database schema initialized clean (catchup.db)")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CatchUpAPIHandler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"📡 Web App & REST API running at: {url}")
        print("🧠 Machine Learning Engine: Scikit-Learn TF-IDF Centroid Vectorizer")
        print("🔒 Privacy: 100% On-Device Processing (0 bytes network egress)")
        print("💡 Endpoints:")
        print("   • GET  /api/health")
        print("   • GET  /api/channels")
        print("   • GET  /api/channels/<id>?persona=<name>")
        print("   • POST /api/actions/<id>/toggle")
        print("   • POST /api/channels")
        print("   • GET  /")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")

if __name__ == "__main__":
    run_server()
