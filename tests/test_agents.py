"""
Tests for 5 Specialized Agents and Orchestrator
"""

import pytest
from agents.incident_analyzer import IncidentAnalyzer
from agents.memory_retriever import MemoryRetriever
from agents.root_cause_investigator import RootCauseInvestigator
from agents.resolution_planner import ResolutionPlanner
from agents.learning_agent import LearningAgent
from agents.orchestrator import AgentOrchestrator


@pytest.fixture
def sample_incident():
    return {
        "title": "API Latency Spike on checkout-api after deployment",
        "service": "checkout-api",
        "severity": "SEV1",
        "environment": "production",
        "description": "p99 latency spiked from 120ms to 4800ms. Endpoints returning HTTP 504.",
        "symptoms": ["p99 latency >4.8s", "HikariCP pool lockup (50/50 active)"],
        "logs": "HikariPool - Connection is not available, request timed out after 30000ms.\nSQLTransientConnectionException: HikariPool-1"
    }


def test_incident_analyzer(sample_incident):
    analyzer = IncidentAnalyzer()
    res = analyzer.analyze(sample_incident)
    assert res["service"] == "checkout-api"
    assert res["severity"] in ["SEV1", "SEV2"]
    assert len(res["symptoms"]) > 0
    assert "blast_radius" in res


def test_memory_retriever():
    retriever = MemoryRetriever()
    res = retriever.retrieve(
        service="checkout-api",
        symptoms=["Elevated latency", "HikariCP connection pool exhausted"],
        logs="HikariPool - Connection is not available"
    )
    assert "recalled_incidents" in res
    assert "wow_chain" in res
    assert res["has_memory"] is True


def test_root_cause_investigator():
    investigator = RootCauseInvestigator()
    # Test stateless
    res_stateless = investigator.investigate(
        analysis={"service": "checkout-api", "symptoms": ["latency"]},
        memory_data={},
        stateless_mode=True
    )
    assert res_stateless["confidence_score"] < 50
    assert "Low" in res_stateless["confidence_label"]

    # Test with memory
    res_memory = investigator.investigate(
        analysis={"service": "checkout-api", "symptoms": ["latency", "pool"]},
        memory_data={"recalled_incidents": [{"fact": {"text": "Root Cause: HikariCP pool lockup"}, "score": 0.95}]},
        stateless_mode=False
    )
    assert res_memory["confidence_score"] > 80
    assert "Hikari" in res_memory["probable_root_cause"] or "pool" in res_memory["probable_root_cause"].lower()


def test_resolution_planner():
    planner = ResolutionPlanner()
    plan = planner.plan(
        analysis={"service": "checkout-api"},
        investigation={"probable_root_cause": "HikariCP pool lockup"},
        memory_data={"recalled_incidents": [{"fact": {"text": "pool"}, "score": 0.95}]},
        stateless_mode=False
    )
    assert len(plan["actions"]) > 0
    # Must have human approval flag on dangerous steps
    approval_steps = [a for a in plan["actions"] if a["requires_approval"]]
    assert len(approval_steps) > 0


def test_learning_agent():
    learner = LearningAgent()
    res = learner.process_resolution_and_learn(
        incident_id="INC-UNIT-TEST",
        service="checkout-api",
        symptoms=["p99 latency"],
        root_cause="Unindexed query",
        resolution="Added index",
        feedback="Resolved in 3 minutes",
        rating=5
    )
    assert res["status"] == "LEARNING_STORED"
    assert "evolution_stage" in res


def test_orchestrator_comparison_mode(sample_incident):
    orchestrator = AgentOrchestrator()
    comp = orchestrator.compare_modes(sample_incident)
    assert "stateless" in comp
    assert "hindsight" in comp
    assert comp["hindsight"]["confidence_score"] > comp["stateless"]["confidence_score"]
