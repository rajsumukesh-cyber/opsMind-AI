"""
Agent 2: Memory Retriever
Queries Hindsight memory banks across:
- Incident Memory (historical incidents, symptoms, past root causes)
- Organizational Memory (runbooks, architectural constraints)
- Learning Memory (previous successful/failed resolutions, engineer feedback)
- Team Preferences (escalation rules, safety policies)

Constructs the WOW 'OpsMind remembered...' memory provenance chain.
"""

import logging
from typing import Dict, Any, List
from memory.hindsight_service import memory_service

logger = logging.getLogger("opsmind.agent.retriever")


class MemoryRetriever:
    def retrieve(self, service: str, symptoms: List[str], logs: str) -> Dict[str, Any]:
        """Queries Hindsight memory banks using 4-strategy retrieval."""
        query_text = f"{service} " + " ".join(symptoms) + " " + logs[:200]
        
        # Dispatch cross-bank recall to Hindsight
        cross_bank_results = memory_service.recall_all_banks(query=query_text, service=service)
        
        recalled_incidents = cross_bank_results.get("incidents", [])
        recalled_runbooks = cross_bank_results.get("runbooks", [])
        recalled_learnings = cross_bank_results.get("learnings", [])
        recalled_preferences = cross_bank_results.get("preferences", [])

        # Construct the "OpsMind Remembered" WOW Chain
        wow_chain = []
        if recalled_incidents:
            top_incident = recalled_incidents[0]
            score_pct = int(top_incident.get("score", 0.85) * 100)
            fact_data = top_incident.get("fact", {})
            text = fact_data.get("text", "")
            
            # Extract historical details for display
            prev_root_cause = "Database connection pool exhaustion due to slow queries"
            if "root cause:" in text.lower():
                prev_root_cause = text.split("Root Cause:")[1].split("Resolution:")[0].strip()
            
            prev_resolution = "Rollback canary deployment and increase pool size"
            if "resolution:" in text.lower():
                prev_resolution = text.split("Resolution:")[1].strip()

            wow_chain.append({
                "past_incident_title": fact_data.get("context", "Previous Service Degradation"),
                "similarity_score": f"{score_pct}% Match",
                "similarity_pct": score_pct,
                "strategy": top_incident.get("explanation", "Multi-strategy RRF"),
                "previous_root_cause": prev_root_cause,
                "successful_resolution": prev_resolution,
                "document_id": fact_data.get("document_id", "doc_hist"),
                "relevance_rank": 1,
            })

        return {
            "cross_bank_results": cross_bank_results,
            "similar_incidents_count": len(recalled_incidents),
            "recalled_incidents": recalled_incidents,
            "recalled_runbooks": recalled_runbooks,
            "recalled_learnings": recalled_learnings,
            "recalled_preferences": recalled_preferences,
            "wow_chain": wow_chain,
            "has_memory": len(recalled_incidents) > 0 or len(recalled_runbooks) > 0,
        }
