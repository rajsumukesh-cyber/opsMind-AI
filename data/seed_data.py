"""
OpsMind AI - Realistic Synthetic DevOps Seed Data
Provides initial incidents, logs, post-mortems, and telemetry across microservices.
"""

import json
from datetime import datetime, timezone, timedelta
from backend.database import db
from memory.hindsight_service import memory_service


SEED_INCIDENTS = [
    {
        "id": "INC-8401",
        "title": "API Latency Spike on checkout-api after v2.4.1 deployment",
        "service": "checkout-api",
        "severity": "SEV1",
        "environment": "production",
        "description": "p99 latency spiked from 120ms to 4850ms. HTTP 504 Gateway Timeouts reported by cloudfront edge.",
        "symptoms": [
            "Elevated p99 response times (>4.8s)",
            "HikariCP connection pool exhausted (50/50 active)",
            "Downstream payment gateway timeouts"
        ],
        "logs": (
            "2026-09-27T10:14:22Z [WARN] com.zaxxer.hikari.pool.HikariPool - pool-checkout - Connection is not available, request timed out after 30005ms.\n"
            "2026-09-27T10:14:25Z [ERROR] o.s.b.w.e.t.TomcatWebServer - org.apache.catalina.connector.ClientAbortException: java.io.IOException: Broken pipe\n"
            "2026-09-27T10:14:28Z [ERROR] c.o.c.OrderController - Failed to commit order tx: java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available\n"
            "2026-09-27T10:14:30Z [WARN] k8s.ingress - upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.168.1.5"
        ),
        "metrics": {
            "p99_latency_ms": 4850,
            "active_db_connections": 50,
            "max_db_connections": 50,
            "error_rate_pct": 24.8,
            "cpu_utilization_pct": 42
        },
        "status": "RESOLVED",
        "root_cause": "Release v2.4.1 introduced unindexed join query on orders table, holding DB connection pool locks.",
        "resolution": "Rolled back release v2.4.1 to v2.4.0 and increased Hikari maximum-pool-size to 100 temporarily. Latency restored in 4 minutes.",
        "resolved_by": "Senior SRE On-Call"
    },
    {
        "id": "INC-7922",
        "title": "Session verification failure post Redis Sentinel failover",
        "service": "auth-service",
        "severity": "SEV1",
        "environment": "production",
        "description": "User login and token validation requests failing with HTTP 500 across EU and US clusters.",
        "symptoms": [
            "HTTP 500 on /oauth/token and /verify endpoints",
            "JedisClusterMaxRedirectionsException in auth-service pods",
            "MOVED cluster redirection loops"
        ],
        "logs": (
            "2026-09-25T14:02:11Z [ERROR] redis.clients.jedis.JedisCluster - Too many Cluster redirections? redis.clients.jedis.exceptions.JedisClusterMaxRedirectionsException: Too many Cluster redirections?\n"
            "2026-09-25T14:02:14Z [WARN] c.o.a.SessionManager - Failed to fetch session 8a2f4c: JedisMovedDataException: MOVED 12182 10.0.4.12:6379\n"
            "2026-09-25T14:02:17Z [ERROR] c.o.a.TokenFilter - Token validation aborted due to Redis socket timeout"
        ),
        "metrics": {
            "auth_error_rate_pct": 68.2,
            "redis_connection_errors": 1420,
            "p99_latency_ms": 1200
        },
        "status": "RESOLVED",
        "root_cause": "Sentinel failover completed but auth-service JVM DNS cache TTL was set to infinity, pointing pods to old master IP.",
        "resolution": "Flushed JVM DNS cache and patched ConfigMap with networkaddress.cache.ttl=10. Rolled restart auth-service deployment.",
        "resolved_by": "Platform Lead"
    },
    {
        "id": "INC-9104",
        "title": "Database ShareLock deadlock during payment webhook burst",
        "service": "payment-gateway",
        "severity": "SEV2",
        "environment": "production",
        "description": "Inbound Stripe webhook processing delayed by 15 minutes. High database CPU utilization.",
        "symptoms": [
            "Webhook processing queue backing up (>8,500 messages)",
            "PostgreSQL CPU utilization at 98%",
            "Transaction deadlock exceptions"
        ],
        "logs": (
            "2026-09-20T08:33:02Z [ERROR] postgresql[4192]: [3-1] ERROR:  deadlock detected\n"
            "2026-09-20T08:33:02Z [DETAIL] Process 4192 waits for ShareLock on transaction 8812; blocked by process 4199.\n"
            "2026-09-20T08:33:02Z [HINT]   See server log for query details.\n"
            "2026-09-20T08:33:05Z [ERROR] c.o.p.StripeWebhookHandler - Failed to process webhook evt_3M... due to deadlock retry exhaustion"
        ),
        "metrics": {
            "db_cpu_pct": 98,
            "deadlock_count_per_min": 44,
            "webhook_lag_seconds": 920
        },
        "status": "RESOLVED",
        "root_cause": "Duplicate webhook retries from payment provider acquired row locks on user_balance in alternating order.",
        "resolution": "Applied distributed Redis idempotency lock with 60s TTL on idempotency_key header before initiating DB transaction.",
        "resolved_by": "FinOps SRE"
    },
    {
        "id": "INC-9442",
        "title": "Recurrent API Latency & 504 Timeouts on checkout-api (Active Incident)",
        "service": "checkout-api",
        "severity": "SEV1",
        "environment": "production",
        "description": "Customers complaining of cart checkout failures. p99 response time currently 4,620ms. Hikari pool reporting connection acquisition timeout.",
        "symptoms": [
            "p99 latency 4,620ms",
            "HikariCP pool connections 50/50 locked",
            "Occurred 8 minutes after deployment v2.5.0"
        ],
        "logs": (
            "2026-09-27T18:10:02Z [WARN] com.zaxxer.hikari.pool.HikariPool - pool-checkout - Connection is not available, request timed out after 30000ms.\n"
            "2026-09-27T18:10:05Z [ERROR] c.o.c.CheckoutService - Transaction failed for cart 99241: HikariPool-1 - Connection timeout.\n"
            "2026-09-27T18:10:12Z [WARN] ingress.nginx - upstream server temporarily disabled while connecting to upstream"
        ),
        "metrics": {
            "p99_latency_ms": 4620,
            "active_db_connections": 50,
            "max_db_connections": 50,
            "error_rate_pct": 28.5
        },
        "status": "OPEN",
        "root_cause": "",
        "resolution": "",
        "resolved_by": ""
    }
]


def seed_database_and_memory():
    """Populates SQLite database and Hindsight memory with initial rich data."""
    # Ensure memory banks are seeded
    memory_service.seed_default_memories()

    # Seed SQLite
    for inc in SEED_INCIDENTS:
        existing = db.get_incident(inc["id"])
        if not existing:
            db.create_incident({
                "id": inc["id"],
                "title": inc["title"],
                "service": inc["service"],
                "severity": inc["severity"],
                "environment": inc["environment"],
                "description": inc["description"],
                "symptoms": inc["symptoms"],
                "logs": inc["logs"],
                "metrics": inc["metrics"],
            })
            if inc["status"] == "RESOLVED":
                db.resolve_incident(
                    incident_id=inc["id"],
                    root_cause=inc["root_cause"],
                    resolution=inc["resolution"],
                    resolved_by=inc["resolved_by"]
                )
                db.record_feedback(
                    incident_id=inc["id"],
                    rating=5,
                    feedback_text=f"Resolution worked cleanly. OpsMind recommended {inc['resolution'][:60]}.",
                    was_helpful=True
                )
                # Seed postmortem
                db.save_postmortem({
                    "id": f"pm_{inc['id']}",
                    "incident_id": inc["id"],
                    "executive_summary": f"Postmortem for {inc['title']}. Restored service within normal operating parameters.",
                    "timeline": [
                        {"time": "T-00:00", "event": "Anomaly detected via Prometheus p99 latency alert"},
                        {"time": "T+00:02", "event": "OpsMind Memory Retriever matched historical pattern in Hindsight"},
                        {"time": "T+00:03", "event": "SRE On-Call approved rollback remediation plan"},
                        {"time": "T+00:06", "event": "Service recovery verified; p99 normalized to 110ms"},
                    ],
                    "root_cause_analysis": inc["root_cause"],
                    "preventative_actions": [
                        "Add automated query index validator in CI/CD pipeline",
                        "Configure connection pool leak detection threshold to 5000ms",
                        "Update Hindsight memory with learned pattern"
                    ]
                })

    # Seed feedback events into memory service to demonstrate learning progression
    memory_service.learn(
        incident_id="INC-8401",
        service="checkout-api",
        symptoms="p99 latency >4.8s, HikariCP pool lockup",
        root_cause="Unindexed query in deployment holding connection locks",
        resolution="Rollback deployment immediately; do NOT restart pods without rollback",
        feedback="Spot on. Rolled back in 4 minutes.",
        rating=5,
        resolved_by="Senior SRE"
    )
    memory_service.learn(
        incident_id="INC-7922",
        service="auth-service",
        symptoms="Redis MOVED redirection errors post Sentinel failover",
        root_cause="JVM DNS cache TTL infinity pointing to old Redis master IP",
        resolution="Set networkaddress.cache.ttl=10 and execute rolling restart",
        feedback="Saved 1 hour of troubleshooting. DNS cache was indeed the culprit.",
        rating=5,
        resolved_by="Platform Lead"
    )
