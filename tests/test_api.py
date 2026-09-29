"""
Integration Tests for OpsMind API Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "hindsight" in data


def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "active_incidents" in data
    assert "resolved_incidents" in data
    assert "average_mttr_minutes" in data
    assert "memory_recall_count" in data


def test_create_and_analyze_incident():
    # 1. Create incident
    payload = {
        "title": "Test Auth Degradation",
        "service": "auth-service",
        "severity": "SEV1",
        "environment": "production",
        "description": "Redis MOVED redirection errors in auth cluster.",
        "symptoms": ["Login errors 500", "JedisClusterMaxRedirectionsException"],
        "logs": "MOVED 12182 10.0.4.12:6379"
    }
    create_res = client.post("/api/incidents", json=payload)
    assert create_res.status_code == 200
    inc = create_res.json()["incident"]
    inc_id = inc["id"]

    # 2. Analyze incident
    analyze_res = client.post(f"/api/incidents/{inc_id}/analyze", json={"mode": "hindsight"})
    assert analyze_res.status_code == 200
    res_data = analyze_res.json()["analysis_result"]
    assert "investigation" in res_data
    assert "plan" in res_data
    assert res_data["investigation"]["confidence_score"] > 80

    # 3. Take Action (Human-in-the-Loop)
    actions = res_data["plan"]["actions"]
    if actions:
        action_id = actions[0]["id"]
        action_res = client.post(f"/api/incidents/{inc_id}/action", json={
            "action_id": action_id,
            "action_type": "approve",
            "notes": "Approved by automated test"
        })
        assert action_res.status_code == 200
        assert action_res.json()["decision"] == "APPROVE"

    # 4. Resolve incident
    resolve_res = client.post(f"/api/incidents/{inc_id}/resolve", json={
        "root_cause": "Redis DNS cache expired IP",
        "resolution": "Applied networkaddress.cache.ttl=10",
        "resolved_by": "Test SRE"
    })
    assert resolve_res.status_code == 200
    assert resolve_res.json()["incident"]["status"] == "RESOLVED"

    # 5. Submit feedback
    fb_res = client.post(f"/api/incidents/{inc_id}/feedback", json={
        "rating": 5,
        "feedback_text": "Great diagnostic accuracy. Saved 30 mins.",
        "was_recommendation_helpful": True
    })
    assert fb_res.status_code == 200
    assert "Hindsight memory successfully updated" in fb_res.json()["message"]


def test_memory_stats_and_search():
    stats_res = client.get("/api/memory/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_facts"] > 0

    search_res = client.get("/api/memory/search?q=checkout")
    assert search_res.status_code == 200
    assert len(search_res.json()["facts"]) > 0


def test_learning_evolution_endpoint():
    res = client.get("/api/learning/evolution")
    assert res.status_code == 200
    data = res.json()
    assert "milestones" in data
    assert len(data["milestones"]) == 4
    assert "progression_curve" in data


def test_demo_mode_full_scenario():
    res = client.post("/api/demo/full-scenario")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "comparison" in data
    assert "wow_memory_chain" in data
