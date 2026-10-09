# Catch-Up-AI ⚡ "What Did I Miss?"
### Complete Full-Stack Local-First AI Micro-App (Frontend + Backend + ML Engine)

**CatchUp AI** is a privacy-focused micro-app that helps users catch up on long, unread chat conversations. It summarizes important messages, identifies decisions, tasks, and deadlines, and detects changes in plans. Its local-first approach aims to keep conversations private while helping users focus on what matters most.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Catch--Up--AI-6366f1?style=for-the-badge&logo=github)](https://github.com/SaniaThabassum/Catch-Up-AI#catch-up-ai)
[![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-10b981?style=for-the-badge)](https://github.com/SaniaThabassum/Catch-Up-AI#catch-up-ai)
[![Zero Cloud Egress](https://img.shields.io/badge/Cloud%20Egress-0%20Bytes-059669?style=for-the-badge)](https://github.com/SaniaThabassum/Catch-Up-AI#catch-up-ai)

> **Repository:** [https://github.com/SaniaThabassum/Catch-Up-AI#catch-up-ai](https://github.com/SaniaThabassum/Catch-Up-AI#catch-up-ai)  
> **Challenge:** The Unread Problem — "What Did I Miss?"  
> Help users quickly comprehend, prioritize, and act upon long, unread chat conversations with **zero cloud data egress** (100% on-device processing).

---

## 🏗️ Full-Stack System Architecture

CatchUp AI is built as a complete, end-to-end full-stack prototype:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser Client)                      │
│  • Modern Single-Page Application (Linear / Raycast / Slack aesthetic) │
│  • Hero 30-Second Digest ("What Did I Miss?" Executive Summary)        │
│  • Priority Feed with 0-100 Urgency Score Ribbons                      │
│  • Action Items Checklist with Deadlines & Sync                        │
│  • Decisions Log & Interactive Context Thread Inspector                │
│  • Dynamic Persona Switcher (@Alex, @Sarah, @David, or Custom)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Local REST API (HTTP localhost:8080)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Python 3.12 + REST API)                     │
│  • api_server.py: Zero-dependency HTTP REST API & Static File Host    │
│  • Endpoints: /api/health, /api/channels, /api/actions, /api/decisions │
│  • Zero-Egress Sandbox: Strictly verifies 0 outbound network requests   │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│       MACHINE LEARNING ENGINE        │ │    LOCAL PERSISTENCE LAYER    │
│            (ml_engine.py)            │ │        (database.py)          │
│ • Scikit-Learn TF-IDF Vectorizer     │ │ • SQLite 3 (catchup.db)       │
│ • Centroid-based Semantic Ranking    │ │ • Channels, Messages          │
│ • Multi-factor Urgency Scorer        │ │ • Action Items & Done States  │
│ • Regex Entity & Deadline Parser     │ │ • Decisions Log & Summaries   │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 🌟 Core Capabilities Mapping to Challenge Requirements

| Challenge Requirement | Implementation in CatchUp AI |
| :--- | :--- |
| **Summarizing long, unread conversations** | **"Catch Me Up in 30 Seconds" Hero Banner**: Synthesizes situation status, critical blockers, urgent questions waiting on you, and key takeaways into an executive digest. |
| **Identifying important messages & decisions** | **Decisions Log**: Extracts formal decisions (`"Decision: Roll back release v2.4.2 to v2.4.1"`) with authors and timestamps so users skip repetitive back-and-forth chatter. |
| **Extracting action items & tasks** | **Action Item Tracker**: Isolates commitments, requests (`"@Alex please verify checkout by 2:40 PM"`), assignees, and deadlines with interactive checkboxes synced to SQLite. |
| **Prioritizing by urgency & relevance** | **0–100 Urgency Scoring Engine**: Combines Scikit-Learn TF-IDF centroid similarity with keyword intensity (p0, outage, blocker) into 🔴 Critical, 🟠 High, 🟡 Medium, and 🟢 Low tiers. |
| **Highlighting mentions & deadlines** | **Smart Mentions & Deadline Badges**: Flags direct questions directed at the user, `@mentions`, and due times (*"by 2:30 PM"*, *"EOD today"*, *"ASAP"*). |
| **100% Local-First Processing** | **Zero Network Egress**: Runs completely on your machine. Data never leaves local device memory and local SQLite database (`catchup.db`). |

---

## 🚀 How to Run the Prototype

### 1. Launch the Full-Stack Server (Backend + Frontend)
Run the server launcher in your terminal:
```powershell
python server.py
```
This starts both the **Python REST API** and hosts the **Frontend** at:
👉 **[http://localhost:8080](http://localhost:8080)**

### 2. Standalone Frontend (Zero Server Needed)
If you prefer opening the frontend without any server running, double-click or open [index.html](file:///C:/google%20antigravity/My/index.html) directly in any web browser.
- Automatically falls back to the in-browser client NLP engine.
- Zero build steps, zero node modules required.

### 3. Command-Line Interface (Terminal Mode)
Analyze transcripts right from your terminal:
```powershell
# Analyze for Alex (Frontend Lead)
python catchup_cli.py Alex

# Analyze for David (DevOps / Infrastructure)
python catchup_cli.py David

# Analyze for Sarah (Incident Commander)
python catchup_cli.py Sarah
```

---

## 📡 REST API Reference

The Python backend exposes the following REST endpoints on `http://localhost:8080`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health & Privacy audit: returns `0 Bytes Egress`, SQLite status, and active ML models. |
| `GET` | `/api/channels` | List all available channels with message counts. |
| `GET` | `/api/channels/<id>?persona=<name>` | Runs Scikit-Learn ML analysis for channel and persona; returns digest, metrics, actions, decisions, and priority feed. |
| `POST` | `/api/channels` | Creates a new channel from pasted chat text/JSON and persists it in SQLite. |
| `POST` | `/api/actions/<id>/toggle` | Toggles completion state of an action item in the SQLite database. |
| `GET` | `/api/actions?assignee=<name>` | Retrieves action items across all channels with optional assignee filter. |
| `GET` | `/api/decisions` | Retrieves all logged decisions across channels. |

---

## 📁 Repository Structure

```
C:\google antigravity\My\
├── backend/
│   ├── api_server.py      # Python REST API server & static host (port 8080)
│   ├── database.py        # SQLite 3 local persistence layer (catchup.db)
│   └── ml_engine.py       # Scikit-Learn TF-IDF vectorizer + NLP scoring engine
├── index.html             # Main Single Page Application interface
├── styles.css             # Modern dark-mode UI stylesheet
├── app.js                 # Frontend application controller & REST API sync
├── nlp_engine.js          # Client-side NLP engine (for standalone zero-server mode)
├── sample_data.js         # Realistic simulation datasets (Incident, Launch, Architecture)
├── server.py              # Root server entrypoint
├── catchup_cli.py         # Terminal CLI digest tool
└── README.md              # Full-stack documentation
```

---

## 🔒 Privacy & Local-First Verification

- **0 Network Calls Off-Device**: Verified by the built-in **Local-First Privacy Inspector** (click the shield in the top-right header).
- **Persistent Local Database**: Stored strictly at `backend/catchup.db`.
- **Offline Capable**: Works with no internet connection.
>>>>>>> ecd5581 (feat: complete CatchUp AI prototype for Vibe Coding Hackathon with prompt.md)
