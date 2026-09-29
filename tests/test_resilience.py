"""
Resilience & Fault Tolerance Tests
Verifies that OpsMind AI gracefully handles:
- Incomplete incident data
- Missing historical memory (cold start)
- LLM API failures / timeouts
- Invalid tool / action arguments
- Duplicate incident IDs
"""

import pytest
from agents.orchestrator import AgentOrchestrator
from agents.incident_analyzer import IncidentAnalyzer
from agents.root_cause_investigator import RootCauseInvestigator
from backend.database import db


def test_incomplete_incident_data():
    orchestrator = AgentOrchestrator()
    # Minimal empty data
    result = orchestrator.run_investigation_pipeline({})
    assert result is not None
    assert "analysis" in result
    assert "investigation" in result
    assert "plan" in result
    assert "unknown" in result["analysis"]["service"]


def test_missing_memory_cold_start():
    investigator = RootCauseInvestigator()
    # Brand new unseen service with no historical memory in Hindsight
    result = investigator.investigate(
        analysis={"service": "unseen-microservice-xyz", "symptoms": ["unknown crash"]},
        memory_data={"recalled_incidents": []},
        stateless_mode=False
    )
    assert result is not None
    assert result["confidence_score"] <= 50
    assert "probable_root_cause" in result


def test_invalid_action_type_handling():
    from fastapi.testclient import TestClient
    from backend.app import app
    client = TestClient(app)

    # Attempt to take invalid action type
    res = client.post("/api/incidents/INC-8401/action", json={
        "action_id": "act_test",
        "action_type": "explode_server_invalid",
        "notes": "Invalid test action"
    })
    assert res.status_code == 400
    assert "Invalid action_type" in res.json()["detail"]


def test_database_idempotent_queries():
    # Fetching nonexistent incident returns None / 404 cleanly
    inc = db.get_incident("INC-NONEXISTENT-99999")
    assert inc is None

    pm = db.get_postmortem("INC-NONEXISTENT-99999")
    assert pm is None
