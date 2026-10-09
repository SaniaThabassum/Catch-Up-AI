"""
CatchUp AI - Local SQLite Database Module
Stores channels, messages, action items, decisions, and executive summaries locally.
Guarantees 100% local persistence with zero external cloud dependencies.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "catchup.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Channels table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        author TEXT NOT NULL,
        time TEXT NOT NULL,
        text TEXT NOT NULL,
        score INTEGER DEFAULT 10,
        priority_tier TEXT DEFAULT 'low',
        raw_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id)
    )
    """)

    # Action Items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS action_items (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        author TEXT NOT NULL,
        assignee TEXT NOT NULL,
        task TEXT NOT NULL,
        deadline TEXT,
        time TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id),
        FOREIGN KEY (message_id) REFERENCES messages (id)
    )
    """)

    # Decisions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        author TEXT NOT NULL,
        time TEXT NOT NULL,
        decision TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id),
        FOREIGN KEY (message_id) REFERENCES messages (id)
    )
    """)

    # Changed Plans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS changed_plans (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        author TEXT NOT NULL,
        time TEXT NOT NULL,
        change_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        original_plan TEXT,
        updated_plan TEXT,
        is_tentative INTEGER DEFAULT 0,
        verification_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id),
        FOREIGN KEY (message_id) REFERENCES messages (id)
    )
    """)

    conn.commit()
    conn.close()

def seed_sample_data(datasets):
    """Seed sample data from sample_data.js structure into SQLite"""
    conn = get_db()
    cursor = conn.cursor()

    for ch_id, ch in datasets.items():
        cursor.execute(
            "INSERT OR REPLACE INTO channels (id, name, platform, description) VALUES (?, ?, ?, ?)",
            (ch["id"], ch["name"], ch["platform"], ch["description"])
        )
        cursor.execute("DELETE FROM messages WHERE channel_id = ?", (ch_id,))

        for idx, m in enumerate(ch["messages"]):
            cursor.execute(
                "INSERT INTO messages (id, channel_id, author, time, text, raw_index) VALUES (?, ?, ?, ?, ?, ?)",
                (f"{ch_id}_{m['id']}", ch_id, m["author"], m["time"], m["text"], idx)
            )

    conn.commit()
    conn.close()

def save_analysis(channel_id, analysis_result):
    """Save extracted action items, decisions, and changed plans for a channel"""
    conn = get_db()
    cursor = conn.cursor()

    # Clear old extracted items for this channel
    cursor.execute("DELETE FROM action_items WHERE channel_id = ?", (channel_id,))
    cursor.execute("DELETE FROM decisions WHERE channel_id = ?", (channel_id,))
    cursor.execute("DELETE FROM changed_plans WHERE channel_id = ?", (channel_id,))

    for act in analysis_result.get("actionItems", []):
        cursor.execute(
            """INSERT INTO action_items 
               (id, channel_id, message_id, author, assignee, task, deadline, time, completed)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (act["id"], channel_id, act["messageId"], act["author"], act["assignee"],
             act["task"], act.get("deadline"), act["time"], 1 if act.get("completed") else 0)
        )

    for dec in analysis_result.get("decisions", []):
        cursor.execute(
            """INSERT INTO decisions 
               (id, channel_id, message_id, author, time, decision, raw_text)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (dec["id"], channel_id, dec["messageId"], dec["author"], dec["time"],
             dec["decision"], dec["rawText"])
        )

    for cp in analysis_result.get("changedPlans", []):
        cursor.execute(
            """INSERT INTO changed_plans 
               (id, channel_id, message_id, author, time, change_type, summary, original_plan, updated_plan, is_tentative, verification_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (cp["id"], channel_id, cp["messageId"], cp["author"], cp["time"],
             cp["changeType"], cp["summary"], cp.get("originalPlan"), cp.get("updatedPlan"),
             1 if cp.get("isTentative") else 0, cp.get("verificationStatus"))
        )

    conn.commit()
    conn.close()

def clear_session_db():
    """Clear custom channels and reset tasks (Section 9: Privacy Clear Session)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM channels WHERE id LIKE 'custom_%'")
    cursor.execute("DELETE FROM messages WHERE channel_id LIKE 'custom_%'")
    cursor.execute("DELETE FROM action_items WHERE channel_id LIKE 'custom_%'")
    cursor.execute("DELETE FROM decisions WHERE channel_id LIKE 'custom_%'")
    cursor.execute("DELETE FROM changed_plans WHERE channel_id LIKE 'custom_%'")
    cursor.execute("UPDATE action_items SET completed = 0")
    conn.commit()
    conn.close()

def toggle_action_item(action_id):
    """Toggle completed state of an action item"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT completed FROM action_items WHERE id = ?", (action_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    new_state = 0 if row["completed"] == 1 else 1
    cursor.execute("UPDATE action_items SET completed = ? WHERE id = ?", (new_state, action_id))
    conn.commit()
    conn.close()
    return bool(new_state)

def get_channel_messages(channel_id):
    """Get all messages for a channel"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE channel_id = ? ORDER BY raw_index ASC", (channel_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_all_channels():
    """List all channels with message count"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, COUNT(m.id) as message_count 
        FROM channels c 
        LEFT JOIN messages m ON c.id = m.channel_id 
        GROUP BY c.id
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def create_custom_channel(channel_id, name, platform, description, messages):
    """Create a new custom channel and populate messages"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("INSERT OR REPLACE INTO channels (id, name, platform, description) VALUES (?, ?, ?, ?)",
                   (channel_id, name, platform, description))

    cursor.execute("DELETE FROM messages WHERE channel_id = ?", (channel_id,))
    for idx, m in enumerate(messages):
        msg_id = m.get("id") or f"{channel_id}_m{idx}"
        cursor.execute(
            "INSERT INTO messages (id, channel_id, author, time, text, raw_index) VALUES (?, ?, ?, ?, ?, ?)",
            (msg_id, channel_id, m.get("author", "Unknown"), m.get("time", "N/A"), m.get("text", ""), idx)
        )

    conn.commit()
    conn.close()
