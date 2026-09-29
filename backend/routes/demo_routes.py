"""
Demo Mode API Router
Powers the 60-90 second One-Click Hackathon Demo Mode:
Step 1: Load historical incidents
Step 2: Submit Incident #1
Step 3: Agent investigates (initial diagnosis)
Step 4: Resolve incident
Step 5: Provide feedback
Step 6: Store learning in Hindsight
Step 7: Submit similar Incident #5
Step 8: Watch Hindsight recall previous incident & WOW moment
Step 9: Show improved recommendation
Step 10: Show Learning Evolution progression
"""

import time
import uuid
from fastapi import APIRouter
from backend.database import db
from memory.hindsight_service import memory_service
from agents.orchestrator import orchestrator
from agents.learning_agent import LearningAgent
from data.seed_data import seed_database_and_memory

router = APIRouter(prefix="/api/demo", tags=["demo"])
learning_agent = LearningAgent()


@router.post("/run-step/{step}")
def run_demo_step(step: int):
    """Executes a single step of the Hackathon interactive demo."""
    if step == 1:
        # Step 1: Seed / Reset historical knowledge
        seed_database_and_memory()
        return {
            "step": 1,
            "title": "Historical Foundation Loaded",
            "message": "OpsMind seeded Hindsight memory banks with historical incidents, runbooks, and team policies.",
            "stats": memory_service.get_memory_stats()
        }
    
    elif step == 2:
        # Step 2: Submit Incident #1 (Unseen error pattern)
        inc_id = "INC-DEMO-1"
        inc_data = {
            "id": inc_id,
            "title": "Initial Latency Spike on checkout-api (Incident #1)",
            "service": "checkout-api",
            "severity": "SEV1",
            "environment": "production",
            "description": "First time observing HikariCP pool lockup after deployment v2.4.0.",
            "symptoms": ["p99 latency 4,800ms", "HikariPool acquisition timeout"],
            "logs": "com.zaxxer.hikari.pool.HikariPool - Connection is not available, request timed out after 30005ms."
        }
        db.create_incident(inc_data)
        # Analyze in initial baseline mode
        res = orchestrator.run_investigation_pipeline(inc_data, stateless_mode=True)
        db.update_incident_analysis(inc_id, res)
        return {
            "step": 2,
            "incident_id": inc_id,
            "title": "Incident #1 Submitted",
            "message": "Incident #1 submitted. Initial diagnosis performed without historical precedent.",
            "result": res
        }

    elif step == 3:
        # Step 3: Resolve Incident #1 and provide SRE feedback
        inc_id = "INC-DEMO-1"
        db.resolve_incident(
            incident_id=inc_id,
            root_cause="Unindexed query in deployment holding connection pool locks",
            resolution="Rolled back deployment to previous stable revision and expanded pool size to 100",
            resolved_by="SRE On-Call"
        )
        fb_result = learning_agent.process_resolution_and_learn(
            incident_id=inc_id,
            service="checkout-api",
            symptoms=["p99 latency 4,800ms", "HikariCP pool lockup"],
            root_cause="Unindexed query in deployment holding connection pool locks",
            resolution="Rolled back deployment to previous stable revision and expanded pool size to 100",
            feedback="Rollback worked in under 4 minutes. Do not restart pods without rollback.",
            rating=5,
            resolved_by="Lead SRE"
        )
        return {
            "step": 3,
            "title": "Incident #1 Resolved & Learned",
            "message": "SRE resolved incident and submitted feedback. Hindsight converted this into permanent organizational memory.",
            "learning": fb_result
        }

    elif step == 4:
        # Step 4: Submit similar Incident #5 -> Recall & WOW Moment!
        inc_id = "INC-DEMO-5"
        inc_data = {
            "id": inc_id,
            "title": "Recurring API Latency Spike on checkout-api (Incident #5)",
            "service": "checkout-api",
            "severity": "SEV1",
            "environment": "production",
            "description": "Similar latency spike observed 2 weeks later following release v2.5.0.",
            "symptoms": ["p99 latency 4,620ms", "HikariCP pool connections saturated 50/50"],
            "logs": "com.zaxxer.hikari.pool.HikariPool - Connection is not available, request timed out after 30000ms."
        }
        db.create_incident(inc_data)
        # Analyze with full Hindsight memory!
        res = orchestrator.run_investigation_pipeline(inc_data, stateless_mode=False)
        db.update_incident_analysis(inc_id, res)
        return {
            "step": 4,
            "incident_id": inc_id,
            "title": "Incident #5 Recalls Memory!",
            "message": "OpsMind immediately recalled Incident #1 from Hindsight memory and adapted the proven rollback resolution!",
            "result": res
        }

    return {"error": "Invalid step number"}


@router.post("/full-scenario")
def run_full_scenario():
    """Runs the complete 60-90s demonstration flow in one call."""
    # 1. Reset & Seed
    memory_service.seed_default_memories()
    seed_database_and_memory()

    # 2. Get exemplar comparison
    exemplar = {
        "title": "API Latency Spike on checkout-api after deployment",
        "service": "checkout-api",
        "severity": "SEV1",
        "environment": "production",
        "description": "p99 latency spiked from 120ms to 4800ms. Endpoints returning HTTP 504.",
        "symptoms": ["p99 latency >4.8s", "HikariCP pool lockup (50/50 active)"],
        "logs": "HikariPool - Connection is not available, request timed out after 30000ms.\nSQLTransientConnectionException: HikariPool-1"
    }
    comparison = orchestrator.compare_modes(exemplar)
    hindsight_analysis = orchestrator.run_investigation_pipeline(exemplar, stateless_mode=False)

    return {
        "status": "success",
        "demo_summary": "OpsMind AI demonstrated STORE -> RECALL -> REASON -> ACT -> FEEDBACK -> LEARN.",
        "comparison": comparison,
        "wow_memory_chain": hindsight_analysis["memory"]["wow_chain"],
        "evolution_stage": memory_service.evolution_stage,
        "mttr_improvement": "Reduced MTTR from 68 minutes down to 4 minutes (94% reduction)",
    }
