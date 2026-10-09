#!/usr/bin/env python3
"""
CatchUp AI - Command Line Interface (CLI)
Analyzes chat transcripts locally on-device without cloud API dependencies.
Uses the Scikit-Learn TF-IDF Centroid ML Engine + Heuristic Extractors.
Supports any custom .txt / .log chat file, or --demo for sample testing.
"""

import sys
import os
import json
import re

# Ensure utf-8 encoding for Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

from ml_engine import LocalMLEngine

def parse_text_messages(raw_text):
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    messages = []
    for idx, line in enumerate(lines):
        m = re.match(r'^\[?([\d/,\s:]+(?:am|pm)?)\]?[\s-]+([^:]+):\s*(.+)$', line, re.I)
        if m:
            messages.append({
                "id": f"cli_{idx}",
                "time": m.group(1).strip(),
                "author": m.group(2).strip(),
                "text": m.group(3).strip()
            })
        else:
            m_simple = re.match(r'^([A-Za-z0-9_.\s@]{2,25}):\s*(.+)$', line)
            if m_simple and not m_simple.group(1).startswith("http"):
                messages.append({
                    "id": f"cli_{idx}",
                    "time": f"10:{idx:02d} AM",
                    "author": m_simple.group(1).strip(),
                    "text": m_simple.group(2).strip()
                })
    return messages

def print_cli_report(res, persona, source_label="User Chat"):
    actions = res.get("actionItems", [])
    decisions = res.get("decisions", [])
    changed_plans = res.get("changedPlans", [])
    deadlines = res.get("deadlinesRadar", [])
    summary = res.get("summary", {})
    bullets = summary.get("bullets", [])

    my_actions = [a for a in actions if a.get("isAssignedToMe")]

    print("\n" + "=" * 70)
    print(f"📊 CatchUp AI - Executive Digest for @{persona}")
    print(f"📁 Source: {source_label} | {len(res.get('messages', []))} messages analyzed")
    print(f"🔒 100% On-Device Processing • Zero Network Transmission • ML Centroid")
    print("=" * 70)

    print("\n⚡ CATCH ME UP IN 30 SECONDS:")
    for b in bullets:
        b_type = b.get("type", "").upper()
        print(f"  • [{b_type}] {b.get('text')}")

    if changed_plans:
        print("\n" + "-" * 70)
        print(f"🔄 CHANGED-PLAN DETECTOR ({len(changed_plans)} updates):")
        for p in changed_plans:
            v_tag = "[⚠️ TENTATIVE]" if p.get("isTentative") else "[✅ VERIFIED]"
            print(f"  {v_tag} {p.get('summary')}")
            print(f"     Before: {p.get('originalPlan')} ➔ Updated: {p.get('updatedPlan')}")

    if deadlines:
        print("\n" + "-" * 70)
        print(f"⏰ DEADLINES RADAR ({len(deadlines)} time-sensitive items):")
        for d in deadlines:
            p_icon = "🚨" if d.get("priority") == "critical" else ("⚡" if d.get("priority") == "high" else "⏰")
            for_me = " [DUE FROM YOU]" if d.get("isForMe") else f" [@{d.get('assignee')}]"
            print(f"  {p_icon} {d.get('deadline')}{for_me}: {d.get('task')}")
            print(f"     Why Urgent: {d.get('urgencyReason')}")

    print("\n" + "-" * 70)
    print(f"📋 PERSONAL ACTION CENTER ({len(actions)} total | {len(my_actions)} assigned to you):")
    for a in actions:
        badge = "👉 [YOU]" if a.get("isAssignedToMe") else f"   [@{a.get('assignee')}]"
        due = f" | ⏰ Due: {a.get('deadline')}" if a.get('deadline') else ""
        prio = f" | ⚡ [{a.get('priority', 'medium').upper()}]"
        print(f"  {badge} {a.get('task')}{due}{prio}")

    print("\n" + "-" * 70)
    print(f"⚖️  FINALIZED DECISIONS ({len(decisions)}):")
    for d in decisions:
        print(f"  ✅ {d.get('decision')} (facilitated by {d.get('author')} at {d.get('time')})")

    critical_missed = res.get("criticalUpdatesMissed", [])
    if critical_missed:
        print("\n" + "-" * 70)
        print(f"🚨 CRITICAL UPDATES MISSED WHILE AWAY ({len(critical_missed)}):")
        for c in critical_missed:
            print(f"  🔴 [{c.get('time')}] {c.get('author')}: {c.get('text')}")

    timeline = res.get("chronologicalTimeline", [])
    if timeline:
        print("\n" + "-" * 70)
        print(f"⏱️  CHRONOLOGICAL TIMELINE OF IMPORTANT EVENTS ({len(timeline)} milestones):")
        for ev in timeline:
            print(f"  • [{ev.get('time')}] {ev.get('badge')}: {ev.get('title')}")
            print(f"    ↳ {ev.get('description')}")

    print("\n" + "=" * 70)
    stats = res.get("stats", {})
    print(f"⚡ Computed in {stats.get('executionTimeMs', 0)}ms | Egress: {stats.get('bytesTransmitted', 0)} B | ML: {stats.get('mlEngine')}\n")

def main():
    persona = "Alex"
    file_path = None
    is_demo = False

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg in ("--persona", "-p") and i + 1 < len(args):
            persona = args[i + 1]
            i += 2
        elif arg in ("--file", "-f") and i + 1 < len(args):
            file_path = args[i + 1]
            i += 2
        elif arg in ("--demo", "-d"):
            is_demo = True
            i += 1
        elif not arg.startswith("-"):
            if not file_path and os.path.exists(arg):
                file_path = arg
            else:
                persona = arg
            i += 1
        else:
            i += 1

    messages = []
    source_label = "Demo Incident Sample"

    if file_path:
        if not os.path.exists(file_path):
            print(f"❌ Error: File '{file_path}' not found.")
            return
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        messages = parse_text_messages(content)
        source_label = os.path.basename(file_path)
        if not messages:
            print(f"⚠️ No messages could be parsed from '{file_path}'. Verify format (e.g. [10:15 AM] Name: text).")
            return
    elif is_demo or len(args) == 0:
        # Load demo sample
        import subprocess
        cmd = ["node", "-e", """
            const { SAMPLE_DATASETS } = require('./sample_data.js');
            console.log(JSON.stringify(SAMPLE_DATASETS.incident.messages));
        """]
        try:
            out = subprocess.check_output(cmd, cwd=os.path.dirname(__file__))
            messages = json.loads(out.decode("utf-8"))
            source_label = "Demo Sample (For Demonstration Only)"
        except Exception as e:
            print(f"Failed to load demo messages: {e}")
            return
    else:
        print("Usage:")
        print("  python catchup_cli.py --file <chat.txt> [--persona <name>]")
        print("  python catchup_cli.py --demo [--persona <name>]")
        return

    print(f"Running CatchUp AI analysis for user @{persona} on {source_label}...")
    engine = LocalMLEngine()
    results = engine.analyze_messages(messages, persona=persona)
    print_cli_report(results, persona, source_label)

if __name__ == "__main__":
    main()
