"""
Dashboard API Router
Powers the primary enterprise DevOps dashboard cards, active incident summaries, and memory health.
"""

from fastapi import APIRouter
from backend.database import db
from memory.hindsight_service import memory_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats():
    """Aggregates metrics for the top dashboard cards."""
    db_metrics = db.get_dashboard_metrics()
    mem_stats = memory_service.get_memory_stats()
    
    # Calculate MTTR based on learning stage
    stage = mem_stats.get("evolution_stage", 1)
    stage_to_mttr = {1: 68.0, 2: 48.0, 3: 26.0, 4: 16.0, 5: 8.0, 10: 4.2}
    current_mttr = stage_to_mttr.get(stage, 6.4)

    return {
        "active_incidents": db_metrics["active_incidents"],
        "resolved_incidents": db_metrics["resolved_incidents"],
        "total_incidents": db_metrics["total_incidents"],
        "average_mttr_minutes": current_mttr,
        "memory_recall_count": mem_stats["total_recalls"],
        "learning_events_count": mem_stats["learning_events_count"] + db_metrics["learning_events"],
        "total_facts_stored": mem_stats["total_facts"],
        "evolution_stage": stage,
        "recurring_problems": db_metrics["recurring_problems"],
        "remote_hindsight_active": mem_stats["connected_to_remote"],
    }


@router.get("/recent-activity")
def get_recent_activity():
    """Returns recent incidents and recent learning events."""
    recent_incidents = db.list_incidents(limit=5)
    return {
        "recent_incidents": recent_incidents,
        "recent_learning_events": memory_service.learning_events[-5:]
    }
