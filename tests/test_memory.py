"""
Tests for Hindsight Memory Layer
Validates STORE -> RECALL -> REASON -> ACT -> FEEDBACK -> LEARN.
"""

import pytest
from memory.hindsight_service import HindsightMemoryService, MemoryFact


@pytest.fixture
def memory_svc():
    return HindsightMemoryService()


def test_memory_service_initialization(memory_svc):
    assert memory_svc is not None
    assert "incident-memory" in memory_svc.banks
    assert "organizational-memory" in memory_svc.banks
    assert "learning-memory" in memory_svc.banks
    assert "team-preferences" in memory_svc.banks


def test_remember_and_recall_experience(memory_svc):
    facts = memory_svc.remember(
        bank_id="incident-memory",
        content="Incident TEST-01 [order-service]: Connection pool timeout after migration",
        context="Test Incident",
        tags=["service:order-service", "status:resolved"],
        document_id="doc_test_01"
    )
    assert len(facts) >= 1
    assert facts[0]["document_id"] == "doc_test_01"

    # Recall query
    results = memory_svc.recall(
        bank_id="incident-memory",
        query="order-service connection pool timeout",
        budget="mid"
    )
    assert len(results) > 0
    top_result = results[0]
    assert "order-service" in top_result["fact"]["text"].lower() or "pool" in top_result["fact"]["text"].lower()
    assert top_result["score"] > 0.0


def test_tag_filtering_strict(memory_svc):
    memory_svc.remember(
        bank_id="incident-memory",
        content="Service Alpha memory item",
        tags=["service:alpha", "env:prod"],
        document_id="doc_alpha"
    )
    memory_svc.remember(
        bank_id="incident-memory",
        content="Service Beta memory item",
        tags=["service:beta", "env:prod"],
        document_id="doc_beta"
    )

    # Search with strict tag filter
    results = memory_svc.recall(
        bank_id="incident-memory",
        query="memory item",
        tags=["service:alpha"],
        tags_match="any_strict"
    )
    for r in results:
        assert "service:alpha" in r["fact"]["tags"]
        assert "service:beta" not in r["fact"]["tags"]


def test_learn_step_and_evolution(memory_svc):
    initial_events = len(memory_svc.learning_events)
    
    event = memory_svc.learn(
        incident_id="INC-TEST-LEARN",
        service="checkout-api",
        symptoms="High p99 latency",
        root_cause="Unindexed query",
        resolution="Added database index on order_date",
        feedback="Resolved in 2 minutes",
        rating=5,
        resolved_by="Test SRE"
    )
    assert event["incident_id"] == "INC-TEST-LEARN"
    assert len(memory_svc.learning_events) == initial_events + 1
    assert event["new_stage"] >= 1


def test_memory_telemetry_stats(memory_svc):
    stats = memory_svc.get_memory_stats()
    assert "total_facts" in stats
    assert "total_observations" in stats
    assert "total_recalls" in stats
    assert "evolution_stage" in stats
    assert stats["total_facts"] > 0
