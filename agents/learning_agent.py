"""
Agent 5: Learning Agent
Active post-resolution and upon receiving engineer feedback.
Extracts:
- What happened (incident context & symptoms)
- What worked (successful actions taken)
- What failed (rejected/failed attempts)
- Engineer feedback & ratings
- Final confirmed root cause & verified resolution
Transfers synthesized knowledge into Hindsight memory layers to permanently improve future agent responses.
"""

import logging
from typing import Dict, Any, List
from memory.hindsight_service import memory_service

logger = logging.getLogger("opsmind.agent.learning")


class LearningAgent:
    def process_resolution_and_learn(
        self,
        incident_id: str,
        service: str,
        symptoms: List[str],
        root_cause: str,
        resolution: str,
        feedback: str,
        rating: int = 5,
        actions_taken: List[Dict[str, Any]] = None,
        resolved_by: str = "Lead SRE",
    ) -> Dict[str, Any]:
        """Synthesizes resolution lessons and stores them into Hindsight memory banks."""
        symptoms_str = ", ".join(symptoms) if isinstance(symptoms, list) else str(symptoms)
        
        # Analyze what worked vs what failed
        actions_taken = actions_taken or []
        successful_actions = [a.get("title", "") for a in actions_taken if a.get("status") == "approved" or a.get("status") == "executed"]
        rejected_actions = [a.get("title", "") for a in actions_taken if a.get("status") == "rejected"]

        what_worked = "; ".join(successful_actions) if successful_actions else resolution
        what_failed = "; ".join(rejected_actions) if rejected_actions else "None reported"

        # Record learning event in Hindsight
        learning_event = memory_service.learn(
            incident_id=incident_id,
            service=service,
            symptoms=symptoms_str,
            root_cause=root_cause,
            resolution=resolution,
            feedback=f"{feedback} (What worked: {what_worked}. What avoided: {what_failed})",
            rating=rating,
            resolved_by=resolved_by,
        )

        logger.info(f"Hindsight learned from incident {incident_id}: new stage {learning_event.get('new_stage')}")

        return {
            "incident_id": incident_id,
            "status": "LEARNING_STORED",
            "what_happened": symptoms_str,
            "what_worked": what_worked,
            "what_failed": what_failed,
            "engineer_feedback": feedback,
            "rating": rating,
            "hindsight_event": learning_event,
            "evolution_stage": learning_event.get("new_stage", 1),
            "learning_summary": (
                f"OpsMind committed new observation to Hindsight learning-memory. "
                f"Symptom '{symptoms_str[:60]}' now strongly associated with fix '{resolution[:60]}'."
            )
        }
