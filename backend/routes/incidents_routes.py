"""
Incidents API Router
Handles creation, retrieval, AI analysis, human action approval, resolution, and feedback.
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from backend.models import IncidentCreate, IncidentAction, IncidentResolve, IncidentFeedback, AnalyzeRequest
from backend.database import db
from agents.orchestrator import orchestrator
from agents.learning_agent import LearningAgent
from backend.auth import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["incidents"])
learning_agent = LearningAgent()


@router.post("", response_model=dict)
def create_incident(data: IncidentCreate, user: dict = Depends(get_current_user)):
    """Creates a new incident in OpsMind."""
    inc_id = f"INC-{uuid.uuid4().hex[:4].upper()}"
    incident_dict = {
        "id": inc_id,
        "title": data.title,
        "service": data.service,
        "severity": data.severity,
        "environment": data.environment,
        "description": data.description,
        "symptoms": data.symptoms or [],
        "logs": data.logs or "",
        "metrics": data.metrics or {},
    }
    created = db.create_incident(incident_dict)
    return {"status": "success", "incident": created}


@router.get("", response_model=List[dict])
def list_incidents(limit: int = 50, service: Optional[str] = None):
    """Lists incidents with optional service filter."""
    return db.list_incidents(limit=limit, service=service)


@router.get("/{incident_id}", response_model=dict)
def get_incident(incident_id: str):
    """Retrieves full incident details including actions, feedback, and cached analysis."""
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.post("/{incident_id}/analyze", response_model=dict)
def analyze_incident(incident_id: str, req: AnalyzeRequest = None):
    """
    Executes the multi-agent investigation pipeline for an incident.
    Supports mode='hindsight' (default) or mode='stateless' (comparison).
    """
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    mode = req.mode if req else "hindsight"
    stateless = (mode == "stateless")

    pipeline_result = orchestrator.run_investigation_pipeline(inc, stateless_mode=stateless)
    
    # Cache analysis and populate actions in database
    db.update_incident_analysis(incident_id, pipeline_result)
    
    updated_inc = db.get_incident(incident_id)
    return {
        "status": "success",
        "mode": mode,
        "incident": updated_inc,
        "analysis_result": pipeline_result
    }


@router.post("/{incident_id}/action", response_model=dict)
def take_action(incident_id: str, act: IncidentAction, user: dict = Depends(get_current_user)):
    """
    Human-in-the-Loop decision:
    Approve, Reject, Modify, or Escalate a recommended remediation action.
    """
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    valid_types = ["approve", "reject", "modify", "escalate"]
    if act.action_type.lower() not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid action_type. Must be one of: {valid_types}")

    db.update_action_status(
        action_id=act.action_id,
        action_type=act.action_type,
        notes=act.notes or f"Action {act.action_type}ed by {user.get('username', 'user')}",
        modified_command=act.modified_command
    )

    updated_inc = db.get_incident(incident_id)
    return {
        "status": "success",
        "action_id": act.action_id,
        "decision": act.action_type.upper(),
        "incident": updated_inc
    }


@router.post("/{incident_id}/resolve", response_model=dict)
def resolve_incident(incident_id: str, req: IncidentResolve, user: dict = Depends(get_current_user)):
    """Marks the incident as resolved with root cause and final resolution."""
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    resolved_by = req.resolved_by or user.get("username", "Lead SRE")
    updated = db.resolve_incident(
        incident_id=incident_id,
        root_cause=req.root_cause,
        resolution=req.resolution,
        resolved_by=resolved_by
    )

    return {"status": "success", "incident": updated}


@router.post("/{incident_id}/feedback", response_model=dict)
def submit_feedback(incident_id: str, fb: IncidentFeedback, user: dict = Depends(get_current_user)):
    """
    Engineer Feedback Submission.
    Invokes Agent 5 (Learning Agent) to convert this experience into permanent Hindsight memory!
    """
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Record in SQLite
    db.record_feedback(
        incident_id=incident_id,
        rating=fb.rating,
        feedback_text=fb.feedback_text,
        was_helpful=fb.was_recommendation_helpful
    )

    # Invoke Learning Agent to retain into Hindsight
    learning_result = learning_agent.process_resolution_and_learn(
        incident_id=incident_id,
        service=inc.get("service", "unknown"),
        symptoms=inc.get("symptoms", []),
        root_cause=inc.get("root_cause") or "Identified via AI diagnosis",
        resolution=inc.get("resolution") or "Applied verified plan actions",
        feedback=fb.feedback_text,
        rating=fb.rating,
        actions_taken=inc.get("actions", []),
        resolved_by=user.get("username", "SRE Lead")
    )

    return {
        "status": "success",
        "message": "Feedback recorded. Hindsight memory successfully updated with new learning.",
        "learning": learning_result,
        "incident": db.get_incident(incident_id)
    }
