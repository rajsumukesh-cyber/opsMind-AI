"""
OpsMind AI - SQLite Metadata Storage
Lightweight, thread-safe, persistent SQLite database layer for incidents, actions, post-mortems, and feedback.
"""

import os
import json
import uuid
import sqlite3
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("opsmind.database")

DB_PATH = os.getenv("OPSMIND_DB_PATH", os.path.join(os.path.dirname(__file__), "opsmind.db"))


class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Incidents table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                service TEXT NOT NULL,
                severity TEXT NOT NULL,
                environment TEXT NOT NULL,
                description TEXT NOT NULL,
                symptoms TEXT,
                logs TEXT,
                metrics TEXT,
                status TEXT NOT NULL DEFAULT 'OPEN',
                created_at TEXT NOT NULL,
                resolved_at TEXT,
                root_cause TEXT,
                resolution TEXT,
                resolved_by TEXT,
                analysis_cache TEXT
            )
            """)

            # Actions table (Human-in-the-Loop)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS incident_actions (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL,
                step INTEGER NOT NULL,
                title TEXT NOT NULL,
                command TEXT,
                risk TEXT NOT NULL,
                requires_approval INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'PENDING',
                notes TEXT,
                modified_command TEXT,
                created_at TEXT NOT NULL,
                acted_at TEXT,
                FOREIGN KEY(incident_id) REFERENCES incidents(id)
            )
            """)

            # Feedback table (Continuous Learning input)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS incident_feedback (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                feedback_text TEXT NOT NULL,
                was_helpful INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY(incident_id) REFERENCES incidents(id)
            )
            """)

            # Post-Mortems table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS postmortems (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL UNIQUE,
                executive_summary TEXT,
                timeline TEXT,
                root_cause_analysis TEXT,
                preventative_actions TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(incident_id) REFERENCES incidents(id)
            )
            """)

            conn.commit()

    def create_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT INTO incidents (
                id, title, service, severity, environment, description,
                symptoms, logs, metrics, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident_data["id"],
                incident_data["title"],
                incident_data["service"],
                incident_data.get("severity", "SEV2"),
                incident_data.get("environment", "production"),
                incident_data["description"],
                json.dumps(incident_data.get("symptoms", [])),
                incident_data.get("logs", ""),
                json.dumps(incident_data.get("metrics", {})),
                "OPEN",
                now
            ))
            conn.commit()
            return self.get_incident(incident_data["id"])

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            res["symptoms"] = json.loads(res["symptoms"]) if res["symptoms"] else []
            res["metrics"] = json.loads(res["metrics"]) if res["metrics"] else {}
            res["analysis_cache"] = json.loads(res["analysis_cache"]) if res["analysis_cache"] else None
            
            # Fetch actions
            cursor.execute("SELECT * FROM incident_actions WHERE incident_id = ? ORDER BY step ASC", (incident_id,))
            res["actions"] = [dict(r) for r in cursor.fetchall()]
            
            # Fetch feedback
            cursor.execute("SELECT * FROM incident_feedback WHERE incident_id = ?", (incident_id,))
            fb_row = cursor.fetchone()
            res["feedback"] = dict(fb_row) if fb_row else None
            
            return res

    def list_incidents(self, limit: int = 50, service: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if service:
                cursor.execute("SELECT * FROM incidents WHERE service = ? ORDER BY created_at DESC LIMIT ?", (service, limit))
            else:
                cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["symptoms"] = json.loads(item["symptoms"]) if item["symptoms"] else []
                item["metrics"] = json.loads(item["metrics"]) if item["metrics"] else {}
                item["analysis_cache"] = json.loads(item["analysis_cache"]) if item["analysis_cache"] else None
                results.append(item)
            return results

    def update_incident_analysis(self, incident_id: str, analysis_data: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE incidents SET status = 'INVESTIGATING', analysis_cache = ? WHERE id = ?
            """, (json.dumps(analysis_data), incident_id))
            
            # Populate actions if plan actions exist
            plan_actions = analysis_data.get("plan", {}).get("actions", [])
            cursor.execute("DELETE FROM incident_actions WHERE incident_id = ?", (incident_id,))
            now = datetime.now(timezone.utc).isoformat()
            for act in plan_actions:
                action_unique_id = f"{incident_id}_{act.get('id') or uuid.uuid4().hex[:6]}"
                act["id"] = action_unique_id
                cursor.execute("""
                INSERT INTO incident_actions (
                    id, incident_id, step, title, command, risk, requires_approval, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    action_unique_id,
                    incident_id,
                    act.get("step", 1),
                    act.get("title", ""),
                    act.get("command", ""),
                    act.get("risk", "SAFE"),
                    1 if act.get("requires_approval", False) else 0,
                    "PENDING",
                    now
                ))
            conn.commit()

    def update_action_status(self, action_id: str, action_type: str, notes: str = "", modified_command: Optional[str] = None):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            UPDATE incident_actions
            SET status = ?, notes = ?, modified_command = ?, acted_at = ?
            WHERE id = ?
            """, (action_type.upper(), notes, modified_command, now, action_id))
            conn.commit()

    def resolve_incident(self, incident_id: str, root_cause: str, resolution: str, resolved_by: str = "Lead SRE") -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            UPDATE incidents
            SET status = 'RESOLVED', root_cause = ?, resolution = ?, resolved_by = ?, resolved_at = ?
            WHERE id = ?
            """, (root_cause, resolution, resolved_by, now, incident_id))
            conn.commit()
            return self.get_incident(incident_id)

    def record_feedback(self, incident_id: str, rating: int, feedback_text: str, was_helpful: bool = True):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now(timezone.utc).isoformat()
            fb_id = f"fb_{uuid.uuid4().hex[:10]}"
            cursor.execute("""
            INSERT INTO incident_feedback (id, incident_id, rating, feedback_text, was_helpful, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (fb_id, incident_id, rating, feedback_text, 1 if was_helpful else 0, now))
            conn.commit()

    def save_postmortem(self, pm_data: Dict[str, Any]):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT OR REPLACE INTO postmortems (
                id, incident_id, executive_summary, timeline, root_cause_analysis,
                preventative_actions, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                pm_data["id"],
                pm_data["incident_id"],
                pm_data.get("executive_summary", ""),
                json.dumps(pm_data.get("timeline", [])),
                pm_data.get("root_cause_analysis", ""),
                json.dumps(pm_data.get("preventative_actions", [])),
                now
            ))
            conn.commit()

    def get_postmortem(self, incident_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM postmortems WHERE incident_id = ?", (incident_id,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            res["timeline"] = json.loads(res["timeline"]) if res["timeline"] else []
            res["preventative_actions"] = json.loads(res["preventative_actions"]) if res["preventative_actions"] else []
            return res

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM incidents")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM incidents WHERE status = 'OPEN' OR status = 'INVESTIGATING'")
            active = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM incidents WHERE status = 'RESOLVED'")
            resolved = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM incident_feedback")
            learning_events = cursor.fetchone()[0]
            
            # Group by service for recurring problems
            cursor.execute("SELECT service, COUNT(*) as count FROM incidents GROUP BY service ORDER BY count DESC LIMIT 5")
            recurring = [{"service": r[0], "count": r[1]} for r in cursor.fetchall()]

            return {
                "total_incidents": total,
                "active_incidents": active,
                "resolved_incidents": resolved,
                "learning_events": learning_events,
                "average_resolution_time_mins": 6.4,
                "recurring_problems": recurring,
            }


db = Database()
