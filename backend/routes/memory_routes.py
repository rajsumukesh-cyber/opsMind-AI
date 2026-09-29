"""
Memory API Router
Exposes Hindsight memory bank inspection, semantic search, telemetry, and seeding.
"""

from typing import Optional
from fastapi import APIRouter, Query
from memory.hindsight_service import memory_service
from data.seed_data import seed_database_and_memory

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/stats")
def get_memory_stats():
    """Returns detailed statistics and telemetry about Hindsight memory banks."""
    return memory_service.get_memory_stats()


@router.get("/search")
def search_memory(
    q: str = Query("", description="Query string to search in memory"),
    bank_id: Optional[str] = Query(None, description="Target bank id"),
    limit: int = Query(50, description="Max facts to return")
):
    """Searches memory facts across Hindsight memory banks."""
    facts = memory_service.search_memory(bank_id=bank_id, query=q, limit=limit)
    return {"query": q, "bank_id": bank_id, "count": len(facts), "facts": facts}


@router.get("/banks")
def list_memory_banks():
    """Lists all active Hindsight memory banks, missions, and disposition profiles."""
    stats = memory_service.get_memory_stats()
    return {"banks": stats.get("banks", {})}


@router.post("/seed")
def seed_memories():
    """Re-seeds Hindsight memory with enterprise SRE incidents and runbooks."""
    seed_database_and_memory()
    return {"status": "success", "message": "Hindsight memory banks seeded successfully."}


@router.post("/reset")
def reset_memories():
    """Resets memory state back to clean initial demo state."""
    for bank in memory_service.banks.values():
        bank.facts.clear()
        bank.documents.clear()
        bank.graph_edges.clear()
        bank.observations.clear()
        bank.recall_count = 0
        bank.retain_count = 0
    memory_service.learning_events.clear()
    memory_service.evolution_stage = 1
    memory_service.seed_default_memories()
    return {"status": "success", "message": "Hindsight memory reset to clean baseline."}
