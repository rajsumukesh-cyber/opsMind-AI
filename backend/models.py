"""
Pydantic Schemas for OpsMind AI
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class IncidentCreate(BaseModel):
    title: str = Field(..., example="API Latency Spike on checkout-api after v2.4.1 release")
    service: str = Field(..., example="checkout-api")
    severity: str = Field("SEV2", example="SEV2")
    environment: str = Field("production", example="production")
    description: str = Field(..., example="p99 response latency spiked above 4500ms. Endpoints failing with 504.")
    symptoms: Optional[List[str]] = Field(default_factory=list)
    logs: Optional[str] = Field(default="")
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict)


class IncidentAction(BaseModel):
    action_id: str
    action_type: str = Field(..., example="approve")  # approve, reject, modify, escalate
    notes: Optional[str] = Field("", example="Confirmed safe to rollback to v2.4.0")
    modified_command: Optional[str] = None


class IncidentResolve(BaseModel):
    root_cause: str = Field(..., example="HikariCP connection pool lockup due to unindexed query")
    resolution: str = Field(..., example="Rolled back v2.4.1 to v2.4.0 and increased pool size to 100")
    resolved_by: str = Field("SRE Lead", example="SRE Lead")


class IncidentFeedback(BaseModel):
    rating: int = Field(5, ge=1, le=5)
    feedback_text: str = Field(..., example="The historical rollback suggestion was 100% spot-on and saved 40 minutes.")
    was_recommendation_helpful: bool = True


class AnalyzeRequest(BaseModel):
    mode: str = Field("hindsight", example="hindsight")  # "hindsight" or "stateless"


class UserLogin(BaseModel):
    username: str
    password: str


class PostMortemCreate(BaseModel):
    incident_id: str
    executive_summary: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = None
    root_cause_analysis: Optional[str] = None
    preventative_actions: Optional[List[str]] = None
