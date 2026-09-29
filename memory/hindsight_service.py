"""
OpsMind AI - Hindsight Memory Service
Persistent biomimetic memory layer integrating Hindsight for enterprise incident response.
Demonstrates STORE -> RECALL -> REASON -> ACT -> FEEDBACK -> LEARN.
Supports both Hindsight Cloud/Server API and an embedded high-performance fallback engine.
"""

import os
import re
import math
import time
import uuid
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("opsmind.memory")

# Check for official hindsight-client
try:
    from hindsight_client import Hindsight as OfficialHindsightClient
    HAS_HINDSIGHT_CLIENT = True
except ImportError:
    HAS_HINDSIGHT_CLIENT = False
    logger.info("Official hindsight_client not installed, using built-in resilient engine")


class MemoryFact:
    """Represents an atomic extracted fact in Hindsight memory."""
    def __init__(
        self,
        id: str,
        text: str,
        type: str = "experience",  # "world", "experience", "observation"
        bank_id: str = "incident-memory",
        context: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        entities: Optional[List[str]] = None,
        document_id: Optional[str] = None,
        occurred_at: Optional[str] = None,
        mentioned_at: Optional[str] = None,
        confidence: float = 1.0,
        source_fact_ids: Optional[List[str]] = None,
    ):
        self.id = id
        self.text = text
        self.type = type
        self.bank_id = bank_id
        self.context = context or ""
        self.tags = tags or []
        self.metadata = metadata or {}
        self.entities = entities or []
        self.document_id = document_id or f"doc_{uuid.uuid4().hex[:8]}"
        self.occurred_at = occurred_at or datetime.now(timezone.utc).isoformat()
        self.mentioned_at = mentioned_at or datetime.now(timezone.utc).isoformat()
        self.confidence = confidence
        self.source_fact_ids = source_fact_ids or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "type": self.type,
            "bank_id": self.bank_id,
            "context": self.context,
            "tags": self.tags,
            "metadata": self.metadata,
            "entities": self.entities,
            "document_id": self.document_id,
            "occurred_at": self.occurred_at,
            "mentioned_at": self.mentioned_at,
            "confidence": self.confidence,
            "source_fact_ids": self.source_fact_ids,
        }


class RecallResult:
    """Result of a memory recall operation."""
    def __init__(
        self,
        fact: MemoryFact,
        score: float,
        strategy_scores: Optional[Dict[str, float]] = None,
        explanation: Optional[str] = None,
    ):
        self.fact = fact
        self.score = score
        self.strategy_scores = strategy_scores or {}
        self.explanation = explanation or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fact": self.fact.to_dict(),
            "score": round(self.score, 4),
            "strategy_scores": {k: round(v, 4) for k, v in self.strategy_scores.items()},
            "explanation": self.explanation,
        }


class EmbeddedBiomimeticMemoryBank:
    """
    Self-contained biomimetic memory bank implementing Hindsight concepts:
    - Retain: Fact extraction, entity normalization, tagging
    - Recall: 4-strategy retrieval (semantic vector, BM25, graph, temporal) + RRF fusion
    - Observations: Deduplication & synthesis of recurring patterns
    - Dispositions & Reflection: Disposition-aware contextual reasoning
    """
    def __init__(self, bank_id: str, name: str, mission: str, disposition: Optional[Dict[str, int]] = None):
        self.bank_id = bank_id
        self.name = name
        self.mission = mission
        self.disposition = disposition or {"skepticism": 3, "literalism": 3, "empathy": 2}
        self.facts: Dict[str, MemoryFact] = {}
        self.documents: Dict[str, List[str]] = {}  # document_id -> list of fact_ids
        self.graph_edges: List[Dict[str, Any]] = []  # causal & associative links
        self.observations: List[MemoryFact] = []
        self.recall_count = 0
        self.retain_count = 0

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_\-\.]+\b', text) if len(w) > 1]

    def _compute_bm25_score(self, query_tokens: List[str], text_tokens: List[str]) -> float:
        if not text_tokens or not query_tokens:
            return 0.0
        doc_len = len(text_tokens)
        avg_len = 25.0
        k1 = 1.2
        b = 0.75
        score = 0.0
        for token in query_tokens:
            freq = text_tokens.count(token)
            if freq > 0:
                tf = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc_len / avg_len)))
                score += tf
        return score

    def _compute_semantic_score(self, query_tokens: List[str], text_tokens: List[str]) -> float:
        """Calculates cosine overlap with domain boost for technical symbols."""
        if not query_tokens or not text_tokens:
            return 0.0
        q_set = set(query_tokens)
        t_set = set(text_tokens)
        intersection = q_set.intersection(t_set)
        if not intersection:
            return 0.0
        # Boost for matching technical keywords (e.g. latency, oom, pool, deadlock, 504)
        boost = 1.0
        tech_words = {"latency", "timeout", "exhaustion", "leak", "deadlock", "crashloop", "retry", "504", "500", "oom", "redis", "postgres", "kafka", "cpu"}
        for word in intersection:
            if word in tech_words:
                boost += 0.25
        jaccard = len(intersection) / len(q_set.union(t_set))
        return min(1.0, jaccard * boost)

    def _compute_graph_score(self, query_tokens: List[str], fact: MemoryFact) -> float:
        """Graph traversal: checks if fact entities or tags link to concepts in query."""
        score = 0.0
        q_lower = " ".join(query_tokens)
        for entity in fact.entities:
            if entity.lower() in q_lower:
                score += 0.4
        for tag in fact.tags:
            tag_val = tag.split(":")[-1].lower()
            if tag_val in q_lower:
                score += 0.3
        # Check explicit graph edges
        for edge in self.graph_edges:
            if edge.get("target_id") == fact.id:
                source_concept = edge.get("source_concept", "").lower()
                if source_concept and source_concept in q_lower:
                    score += edge.get("weight", 0.5)
        return min(1.0, score)

    def _compute_temporal_score(self, fact: MemoryFact, query_timestamp: Optional[str] = None) -> float:
        """Temporal recency decay."""
        try:
            now_dt = datetime.fromisoformat(query_timestamp.replace("Z", "+00:00")) if query_timestamp else datetime.now(timezone.utc)
            fact_dt = datetime.fromisoformat(fact.occurred_at.replace("Z", "+00:00"))
            delta_days = max(0.0, (now_dt - fact_dt).total_seconds() / 86400.0)
            # Recency half-life of 30 days
            return math.exp(-0.023 * delta_days)
        except Exception:
            return 0.5

    def retain(
        self,
        content: str,
        context: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        timestamp: Optional[str] = None,
        fact_type: str = "experience",
    ) -> List[MemoryFact]:
        """Stores content, decomposes into structured facts, and indexes entities."""
        self.retain_count += 1
        doc_id = document_id or f"doc_{uuid.uuid4().hex[:8]}"

        # Upsert rule: if document_id exists, purge old facts for that document
        if doc_id in self.documents:
            for old_id in self.documents[doc_id]:
                self.facts.pop(old_id, None)

        # Extract entities automatically (e.g., service, error codes, metrics)
        entities = []
        tags = tags or []
        metadata = metadata or {}
        
        # Detect service entities
        service_match = re.search(r'(?:service|app|component):\s*([a-zA-Z0-9_\-]+)', content, re.IGNORECASE)
        if service_match:
            entities.append(service_match.group(1).lower())
            if f"service:{service_match.group(1).lower()}" not in tags:
                tags.append(f"service:{service_match.group(1).lower()}")

        # Detect error/status codes
        status_matches = re.findall(r'\b(?:HTTP\s*)?([45][0-9]{2})\b', content)
        for s in set(status_matches):
            entities.append(f"status_{s}")
            tags.append(f"status:{s}")

        # Split into distinct facts if multiline or structured
        lines = [line.strip() for line in content.split("\n") if line.strip() and not line.strip().startswith("#")]
        if not lines:
            lines = [content]

        created_facts = []
        fact_ids = []

        for line in lines:
            fact_id = f"fact_{uuid.uuid4().hex[:10]}"
            fact = MemoryFact(
                id=fact_id,
                text=line,
                type=fact_type,
                bank_id=self.bank_id,
                context=context,
                tags=list(set(tags)),
                metadata=metadata,
                entities=list(set(entities)),
                document_id=doc_id,
                occurred_at=timestamp or datetime.now(timezone.utc).isoformat(),
            )
            self.facts[fact_id] = fact
            fact_ids.append(fact_id)
            created_facts.append(fact)

        self.documents[doc_id] = fact_ids

        # Synthesize higher-order observation if relevant
        self._consolidate_observations(created_facts)

        return created_facts

    def _consolidate_observations(self, new_facts: List[MemoryFact]):
        """Deduplicates facts into higher-level observations with evidence backing."""
        for fact in new_facts:
            # Check if this relates to recurring root cause or successful resolution
            if "resolution" in fact.text.lower() or "root cause" in fact.text.lower() or "mitigated" in fact.text.lower():
                service_tags = [t for t in fact.tags if t.startswith("service:")]
                obs_text = f"Consolidated pattern for {service_tags[0] if service_tags else 'system'}: {fact.text}"
                obs_fact = MemoryFact(
                    id=f"obs_{uuid.uuid4().hex[:8]}",
                    text=obs_text,
                    type="observation",
                    bank_id=self.bank_id,
                    context="Automated pattern synthesis",
                    tags=fact.tags + ["type:pattern", "proven:verified"],
                    entities=fact.entities,
                    confidence=0.95,
                    source_fact_ids=[fact.id],
                )
                self.observations.append(obs_fact)
                self.facts[obs_fact.id] = obs_fact

    def recall(
        self,
        query: str,
        types: Optional[List[str]] = None,
        budget: str = "mid",
        tags: Optional[List[str]] = None,
        tags_match: str = "any",
        max_tokens: int = 4096,
        query_timestamp: Optional[str] = None,
    ) -> List[RecallResult]:
        """4-strategy parallel retrieval + Reciprocal Rank Fusion (RRF)."""
        self.recall_count += 1
        query_tokens = self._tokenize(query)

        # Budget determines top-k candidates
        k_map = {"low": 5, "mid": 12, "high": 25}
        top_k = k_map.get(budget, 12)

        candidates: List[MemoryFact] = []
        for fact in self.facts.values():
            if types and fact.type not in types:
                continue

            # Tag filtering
            if tags:
                fact_tags = set(fact.tags)
                query_tags = set(tags)
                if tags_match == "all_strict" and not query_tags.issubset(fact_tags):
                    continue
                elif tags_match == "any_strict" and not query_tags.intersection(fact_tags):
                    continue
                elif tags_match == "exact" and fact_tags != query_tags:
                    continue
                elif tags_match == "any" and query_tags and not query_tags.intersection(fact_tags) and len(fact_tags) > 0:
                    # 'any' includes untagged, so only filter if fact has tags and none match
                    continue

            candidates.append(fact)

        if not candidates:
            return []

        # Run 4 parallel retrieval arms
        bm25_ranked = []
        semantic_ranked = []
        graph_ranked = []
        temporal_ranked = []

        for fact in candidates:
            fact_tokens = self._tokenize(fact.text + " " + fact.context)
            
            s_bm25 = self._compute_bm25_score(query_tokens, fact_tokens)
            s_sem = self._compute_semantic_score(query_tokens, fact_tokens)
            s_graph = self._compute_graph_score(query_tokens, fact)
            s_temp = self._compute_temporal_score(fact, query_timestamp)

            bm25_ranked.append((fact, s_bm25))
            semantic_ranked.append((fact, s_sem))
            graph_ranked.append((fact, s_graph))
            temporal_ranked.append((fact, s_temp))

        # Sort each strategy
        bm25_ranked.sort(key=lambda x: x[1], reverse=True)
        semantic_ranked.sort(key=lambda x: x[1], reverse=True)
        graph_ranked.sort(key=lambda x: x[1], reverse=True)
        temporal_ranked.sort(key=lambda x: x[1], reverse=True)

        # RRF Fusion: RRF_score = sum(1 / (60 + rank))
        rrf_scores: Dict[str, float] = {}
        strategy_details: Dict[str, Dict[str, float]] = {}

        for rank, (fact, score) in enumerate(bm25_ranked):
            rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
            strategy_details.setdefault(fact.id, {})["bm25"] = score

        for rank, (fact, score) in enumerate(semantic_ranked):
            rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
            strategy_details.setdefault(fact.id, {})["semantic"] = score

        for rank, (fact, score) in enumerate(graph_ranked):
            rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
            strategy_details.setdefault(fact.id, {})["graph"] = score

        for rank, (fact, score) in enumerate(temporal_ranked):
            rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (0.5 / (60.0 + rank + 1))
            strategy_details.setdefault(fact.id, {})["temporal"] = score

        # Normalize score to 0..1 scale
        max_rrf = max(rrf_scores.values()) if rrf_scores else 1.0
        results = []
        for fact_id, rrf in sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True):
            fact = self.facts[fact_id]
            norm_score = min(1.0, rrf / max_rrf if max_rrf > 0 else 0.5)
            
            # Filter out near-zero relevance
            st = strategy_details.get(fact_id, {})
            if st.get("bm25", 0) == 0 and st.get("semantic", 0) == 0 and st.get("graph", 0) == 0:
                continue

            results.append(RecallResult(
                fact=fact,
                score=norm_score,
                strategy_scores=st,
                explanation=f"Surfaced via RRF (Semantic: {st.get('semantic',0):.2f}, BM25: {st.get('bm25',0):.2f}, Graph: {st.get('graph',0):.2f})"
            ))

            if len(results) >= top_k:
                break

        return results

    def add_graph_edge(self, source_concept: str, target_fact_id: str, relation: str, weight: float = 0.8):
        """Adds a graph relationship for associative recall."""
        self.graph_edges.append({
            "source_concept": source_concept,
            "target_id": target_fact_id,
            "relation": relation,
            "weight": weight
        })


class HindsightMemoryService:
    """
    Central Hindsight memory layer for OpsMind AI.
    Manages 4 specialized memory banks:
    1. incident-memory (historical incidents, symptoms, logs, outcomes)
    2. organizational-memory (runbooks, architecture topology, team standards)
    3. learning-memory (verified fixes, engineer feedback, failure mode links)
    4. team-preferences (escalation policy, review workflows, safety thresholds)
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(HindsightMemoryService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        if self._initialized:
            return
        
        self.base_url = base_url or os.getenv("HINDSIGHT_API_URL", "http://localhost:8888")
        self.api_key = api_key or os.getenv("HINDSIGHT_API_KEY", "")
        self.client: Optional[Any] = None
        self.use_remote = False

        # Embedded banks
        self.banks: Dict[str, EmbeddedBiomimeticMemoryBank] = {
            "incident-memory": EmbeddedBiomimeticMemoryBank(
                bank_id="incident-memory",
                name="Historical Incidents & Telemetry",
                mission="Extract symptoms, affected services, error signatures, root causes, and resolutions. Ignore noise.",
                disposition={"skepticism": 3, "literalism": 4, "empathy": 1}
            ),
            "organizational-memory": EmbeddedBiomimeticMemoryBank(
                bank_id="organizational-memory",
                name="Organizational Runbooks & Architecture",
                mission="Retain runbooks, architectural constraints, dependencies, and standard operating procedures.",
                disposition={"skepticism": 4, "literalism": 5, "empathy": 1}
            ),
            "learning-memory": EmbeddedBiomimeticMemoryBank(
                bank_id="learning-memory",
                name="Learning & Feedback Evolution",
                mission="Record verified resolutions, engineer corrections, resolution times, and pattern updates.",
                disposition={"skepticism": 2, "literalism": 3, "empathy": 2}
            ),
            "team-preferences": EmbeddedBiomimeticMemoryBank(
                bank_id="team-preferences",
                name="Team Operational Preferences",
                mission="Store team safety guidelines, dangerous action guardrails, and escalation paths.",
                disposition={"skepticism": 4, "literalism": 4, "empathy": 3}
            ),
        }

        # Telemetry & Learning curve trackers
        self.learning_events = []
        self.total_recalls = 0
        self.total_retains = 0
        self.evolution_stage = 1  # 1 (Generic) -> 3 (Pattern) -> 5 (Historical) -> 10 (Personalized)

        # Attempt connecting to real Hindsight if configured
        self._init_client()
        self.seed_default_memories()
        self._initialized = True

    def _init_client(self):
        """Attempts connection to real Hindsight API server if available."""
        if HAS_HINDSIGHT_CLIENT and self.base_url:
            try:
                self.client = OfficialHindsightClient(base_url=self.base_url, timeout=3.0)
                # Quick health check
                version = self.client.get_version()
                logger.info(f"Connected to Hindsight server at {self.base_url}, version {version.api_version}")
                self.use_remote = True
            except Exception as e:
                logger.info(f"Hindsight server not reachable at {self.base_url} ({e}). Using embedded biomimetic engine.")
                self.use_remote = False
        else:
            self.use_remote = False

    def remember(
        self,
        bank_id: str,
        content: str,
        context: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        timestamp: Optional[str] = None,
        fact_type: str = "experience",
    ) -> List[Dict[str, Any]]:
        """Stores knowledge into the specified Hindsight bank."""
        self.total_retains += 1
        bank = self.banks.get(bank_id) or self.banks["incident-memory"]

        # Call remote Hindsight if active
        if self.use_remote and self.client:
            try:
                self.client.retain(
                    bank_id=bank_id,
                    content=content,
                    context=context,
                    tags=tags,
                    metadata=metadata,
                    document_id=document_id,
                    retain_async=False
                )
            except Exception as e:
                logger.warning(f"Remote Hindsight retain failed: {e}. Falling back to embedded store.")

        # Always update local bank for instant querying and fallback stability
        facts = bank.retain(
            content=content,
            context=context,
            tags=tags,
            metadata=metadata,
            document_id=document_id,
            timestamp=timestamp,
            fact_type=fact_type,
        )
        return [f.to_dict() for f in facts]

    def recall(
        self,
        bank_id: str,
        query: str,
        types: Optional[List[str]] = None,
        budget: str = "mid",
        tags: Optional[List[str]] = None,
        tags_match: str = "any",
        max_tokens: int = 4096,
        query_timestamp: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves memories using multi-strategy recall (Semantic, BM25, Graph, Temporal)."""
        self.total_recalls += 1
        bank = self.banks.get(bank_id) or self.banks["incident-memory"]

        # Try remote if configured
        if self.use_remote and self.client:
            try:
                res = self.client.recall(
                    bank_id=bank_id,
                    query=query,
                    types=types,
                    budget=budget,
                    tags=tags,
                    tags_match=tags_match,
                    max_tokens=max_tokens,
                )
                if res and res.results:
                    return [{
                        "fact": {
                            "id": r.id,
                            "text": r.text,
                            "type": r.type,
                            "bank_id": bank_id,
                            "context": getattr(r, "context", ""),
                            "tags": getattr(r, "tags", []),
                            "metadata": getattr(r, "metadata", {}),
                            "entities": getattr(r, "entities", []),
                        },
                        "score": 0.95,
                        "strategy_scores": {"remote_hindsight": 0.95},
                        "explanation": "Retrieved from remote Hindsight cluster"
                    } for r in res.results]
            except Exception as e:
                logger.warning(f"Remote Hindsight recall failed: {e}. Using embedded fallback.")

        # Use embedded biomimetic engine
        results = bank.recall(
            query=query,
            types=types,
            budget=budget,
            tags=tags,
            tags_match=tags_match,
            max_tokens=max_tokens,
            query_timestamp=query_timestamp,
        )
        return [r.to_dict() for r in results]

    def recall_all_banks(self, query: str, service: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Cross-bank multi-agent memory recall.
        Queries incident memory, runbooks, past learnings, and team safety preferences.
        """
        service_tag = [f"service:{service.lower()}"] if service else None
        
        incidents = self.recall(
            bank_id="incident-memory",
            query=query,
            tags=service_tag,
            tags_match="any",
            budget="high",
        )
        runbooks = self.recall(
            bank_id="organizational-memory",
            query=query,
            tags=service_tag,
            tags_match="any",
            budget="mid",
        )
        learnings = self.recall(
            bank_id="learning-memory",
            query=query,
            tags=service_tag,
            tags_match="any",
            budget="mid",
        )
        preferences = self.recall(
            bank_id="team-preferences",
            query=query,
            tags=service_tag,
            tags_match="any",
            budget="low",
        )

        return {
            "incidents": incidents,
            "runbooks": runbooks,
            "learnings": learnings,
            "preferences": preferences,
        }

    def learn(
        self,
        incident_id: str,
        service: str,
        symptoms: str,
        root_cause: str,
        resolution: str,
        feedback: str,
        rating: int = 5,
        resolved_by: str = "SRE On-Call",
    ) -> Dict[str, Any]:
        """
        The critical LEARN step:
        Transforms engineer feedback, verified root cause, and successful actions into permanent Hindsight memories.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        service_clean = service.lower().strip()

        # 1. Store into Learning Memory
        learning_content = (
            f"Verified Resolution for {service_clean}:\n"
            f"Symptoms: {symptoms}\n"
            f"Root Cause: {root_cause}\n"
            f"Working Fix: {resolution}\n"
            f"Engineer Feedback: {feedback} (Rating: {rating}/5)\n"
            f"Resolution Outcome: Success. Verified by {resolved_by}."
        )
        self.remember(
            bank_id="learning-memory",
            content=learning_content,
            context=f"Post-incident learning for incident {incident_id}",
            tags=[f"service:{service_clean}", "status:resolved", "learning:verified_fix"],
            metadata={"incident_id": incident_id, "rating": rating, "resolved_by": resolved_by},
            document_id=f"learn_{incident_id}",
            timestamp=timestamp,
            fact_type="observation"
        )

        # 2. Update Incident Memory with final state
        final_incident_content = (
            f"Incident {incident_id} ({service_clean}) resolved:\n"
            f"Symptom Summary: {symptoms}\n"
            f"Confirmed Root Cause: {root_cause}\n"
            f"Effective Resolution: {resolution}"
        )
        self.remember(
            bank_id="incident-memory",
            content=final_incident_content,
            context=f"Resolved incident archive {incident_id}",
            tags=[f"service:{service_clean}", "status:resolved", "postmortem:complete"],
            metadata={"incident_id": incident_id, "final_status": "RESOLVED"},
            document_id=f"inc_{incident_id}",
            timestamp=timestamp,
            fact_type="experience"
        )

        # 3. Add graph associative link
        self.banks["incident-memory"].add_graph_edge(
            source_concept=symptoms.lower(),
            target_fact_id=f"learn_{incident_id}",
            relation="resolved_by",
            weight=0.95
        )

        # 4. Record learning event and advance evolution stage
        event = {
            "id": f"evt_{uuid.uuid4().hex[:8]}",
            "incident_id": incident_id,
            "service": service_clean,
            "timestamp": timestamp,
            "symptoms": symptoms,
            "root_cause": root_cause,
            "resolution": resolution,
            "feedback": feedback,
            "rating": rating,
            "previous_stage": self.evolution_stage,
        }
        self.learning_events.append(event)
        
        # Advance evolution stage based on cumulative learning
        n_events = len(self.learning_events)
        if n_events >= 7:
            self.evolution_stage = 10
        elif n_events >= 4:
            self.evolution_stage = 5
        elif n_events >= 2:
            self.evolution_stage = 3
        else:
            self.evolution_stage = 2

        event["new_stage"] = self.evolution_stage
        return event

    def search_memory(self, bank_id: Optional[str] = None, query: str = "", limit: int = 50) -> List[Dict[str, Any]]:
        """Searches or lists facts across banks."""
        results = []
        target_banks = [self.banks[bank_id]] if bank_id and bank_id in self.banks else list(self.banks.values())
        
        q_lower = query.lower().strip()
        for b in target_banks:
            for fact in b.facts.values():
                if not q_lower or (q_lower in fact.text.lower() or q_lower in fact.context.lower() or any(q_lower in t.lower() for t in fact.tags)):
                    results.append(fact.to_dict())
                if len(results) >= limit:
                    break
        return results

    def get_memory_stats(self) -> Dict[str, Any]:
        """Provides comprehensive telemetry on Hindsight memory layers."""
        total_facts = sum(len(b.facts) for b in self.banks.values())
        total_observations = sum(len(b.observations) for b in self.banks.values())
        
        return {
            "connected_to_remote": self.use_remote,
            "remote_url": self.base_url if self.use_remote else None,
            "total_facts": total_facts,
            "total_observations": total_observations,
            "total_recalls": self.total_recalls,
            "total_retains": self.total_retains,
            "learning_events_count": len(self.learning_events),
            "evolution_stage": self.evolution_stage,
            "banks": {
                b_id: {
                    "name": b.name,
                    "fact_count": len(b.facts),
                    "observation_count": len(b.observations),
                    "recall_count": b.recall_count,
                    "disposition": b.disposition
                } for b_id, b in self.banks.items()
            }
        }

    def seed_default_memories(self):
        """Seeds realistic historical incidents, runbooks, and team preferences."""
        # 1. Historical Incidents
        historical_incidents = [
            {
                "content": (
                    "Incident INC-8401 [checkout-api] - API Latency Spike After Deployment:\n"
                    "Symptoms: p99 latency spiked from 120ms to 4800ms. HTTP 504 Gateway Timeouts.\n"
                    "Logs: HikariCP pool exhausted, active connections 50/50, pending requests 412.\n"
                    "Root Cause: Release v2.4.1 introduced unindexed join query on orders table, holding DB connection pool locks.\n"
                    "Resolution: Rolled back release v2.4.1 to v2.4.0 and increased Hikari maximum-pool-size to 100 temporarily. Latency restored in 4 minutes."
                ),
                "context": "Postmortem INC-8401",
                "tags": ["service:checkout-api", "status:resolved", "cause:connection_pool", "symptom:latency"],
                "doc_id": "hist_inc_8401",
            },
            {
                "content": (
                    "Incident INC-7922 [auth-service] - Redis Cache Failover Session Drop:\n"
                    "Symptoms: Login requests returning HTTP 500. Auth token verification failures.\n"
                    "Logs: RedisConnectionException: MOVED 12182 10.0.4.12:6379, JedisClusterMaxRedirectionsException.\n"
                    "Root Cause: Sentinel failover completed but auth-service DNS cache TTL was set to infinity, pointing pods to old Redis master.\n"
                    "Resolution: Flushed JVM DNS cache and patched ConfigMap with networkaddress.cache.ttl=10. Rolled restart auth-service deployment."
                ),
                "context": "Postmortem INC-7922",
                "tags": ["service:auth-service", "status:resolved", "cause:redis_dns", "symptom:auth_failure"],
                "doc_id": "hist_inc_7922",
            },
            {
                "content": (
                    "Incident INC-9104 [payment-gateway] - Webhook Retry Storm Deadlock:\n"
                    "Symptoms: Inbound Stripe payment webhooks failing with 500 error. Database CPU at 98%.\n"
                    "Logs: PostgreSQL error: deadlock detected: Process 4192 waits for ShareLock on transaction 8812.\n"
                    "Root Cause: Duplicate webhook retries from Stripe acquired row locks on user_balance in alternating order.\n"
                    "Resolution: Applied distributed Redis idempotency lock with 60s TTL on idempotency_key header before initiating DB transaction."
                ),
                "context": "Postmortem INC-9104",
                "tags": ["service:payment-gateway", "status:resolved", "cause:db_deadlock", "symptom:retry_storm"],
                "doc_id": "hist_inc_9104",
            },
            {
                "content": (
                    "Incident INC-6641 [k8s-ingress] - Memory Leak in Envoy Proxy Ingress:\n"
                    "Symptoms: Intermittent connection resets, OOMKilled pods in ingress-nginx namespace.\n"
                    "Logs: kernel: Out of memory: Kill process 124 (envoy) score 950.\n"
                    "Root Cause: Lua regex filter for bot detection was leaking table references on keep-alive HTTP/2 streams.\n"
                    "Resolution: Disabled bot-regex Lua filter in ConfigMap and bumped container memory limit from 1Gi to 2Gi."
                ),
                "context": "Postmortem INC-6641",
                "tags": ["service:k8s-ingress", "status:resolved", "cause:memory_leak", "symptom:oom_kill"],
                "doc_id": "hist_inc_6641",
            },
            {
                "content": (
                    "Incident INC-5510 [order-db] - PostgreSQL Autovacuum Freeze Lockup:\n"
                    "Symptoms: All write transactions stalled across all microservices.\n"
                    "Logs: WARNING: database 'orders_prod' must be vacuumed within 100000 transactions.\n"
                    "Root Cause: Transaction ID wraparound threshold reached during peak flash sale.\n"
                    "Resolution: Scaled autovacuum_vacuum_cost_limit to 2000 and executed VACUUM FREEZE in maintenance window."
                ),
                "context": "Postmortem INC-5510",
                "tags": ["service:order-db", "status:resolved", "cause:vacuum_freeze", "symptom:write_stall"],
                "doc_id": "hist_inc_5510",
            },
        ]

        for inc in historical_incidents:
            self.remember(
                bank_id="incident-memory",
                content=inc["content"],
                context=inc["context"],
                tags=inc["tags"],
                document_id=inc["doc_id"],
                fact_type="experience"
            )

        # 2. Organizational Runbooks & Architecture Topology
        runbooks = [
            {
                "content": (
                    "Runbook: Troubleshooting High Latency on checkout-api\n"
                    "Step 1: Check HikariCP connection pool metrics in Grafana (checkout-api-dash).\n"
                    "Step 2: If active connections >= 45/50, check pg_stat_activity for long-running unindexed queries.\n"
                    "Step 3: If latency correlated with recent deploy, execute canary rollback: kubectl rollout undo deployment/checkout-api.\n"
                    "Step 4: Do not restart database unless pool leak is verified in application layer."
                ),
                "context": "Checkout API SRE Runbook v3.2",
                "tags": ["service:checkout-api", "type:runbook", "topic:latency"],
                "doc_id": "runbook_checkout_latency",
            },
            {
                "content": (
                    "Runbook: Payment Gateway Webhook Failures\n"
                    "Step 1: Verify Redis idempotency cluster health: redis-cli -h redis-payment-cluster ping.\n"
                    "Step 2: Inspect Dead Letter Queue (DLQ) in AWS SQS payment-dlq-prod.\n"
                    "Step 3: Check PostgreSQL lock contention: SELECT * FROM pg_locks WHERE NOT granted;\n"
                    "Step 4: Enable rate limiter if webhook burst exceeds 1,200 RPS."
                ),
                "context": "Payment Gateway Operating Manual",
                "tags": ["service:payment-gateway", "type:runbook", "topic:webhooks"],
                "doc_id": "runbook_payment_webhooks",
            },
            {
                "content": (
                    "Runbook: Redis Cache Cluster Failover & DNS Cache Recovery\n"
                    "Step 1: Confirm active master node using cluster nodes command.\n"
                    "Step 2: If services report MOVED redirection loops, verify Java networkaddress.cache.ttl=10.\n"
                    "Step 3: Execute rolling pod restart to refresh socket connections: kubectl rollout restart deploy/auth-service."
                ),
                "context": "Redis Cluster Operations Guide",
                "tags": ["service:auth-service", "type:runbook", "topic:redis"],
                "doc_id": "runbook_redis_failover",
            },
        ]

        for rb in runbooks:
            self.remember(
                bank_id="organizational-memory",
                content=rb["content"],
                context=rb["context"],
                tags=rb["tags"],
                document_id=rb["doc_id"],
                fact_type="world"
            )

        # 3. Learning Memory (Validated previous fixes)
        learnings = [
            {
                "content": (
                    "Learned Rule: When checkout-api suffers connection pool exhaustion post-deployment, "
                    "restarting pods without rolling back always causes a cascading failure on upstream gateway. "
                    "Approved action is ALWAYS rollback first, then increase pool size."
                ),
                "context": "Engineering Retrospective Q3",
                "tags": ["service:checkout-api", "learning:resolution_pattern", "safety:critical"],
                "doc_id": "learning_checkout_rollback",
            },
            {
                "content": (
                    "Learned Rule: Stripe webhook storms in payment-gateway must be mitigated with Redis-backed "
                    "idempotency keys rather than increasing Postgres max_connections. Increasing Postgres connections causes lock exhaustion."
                ),
                "context": "Postmortem Remediation INC-9104",
                "tags": ["service:payment-gateway", "learning:idempotency", "safety:database"],
                "doc_id": "learning_payment_idempotency",
            },
        ]

        for l in learnings:
            self.remember(
                bank_id="learning-memory",
                content=l["content"],
                context=l["context"],
                tags=l["tags"],
                document_id=l["doc_id"],
                fact_type="observation"
            )

        # 4. Team Preferences
        preferences = [
            {
                "content": (
                    "Team Policy: SRE On-Call requires explicit human approval before executing any pod restart "
                    "on payment-gateway or modifying database connection settings in production. "
                    "Provide 1-click Approve, Reject, Modify, or Escalate controls."
                ),
                "context": "SRE Governance Handbook 2026",
                "tags": ["team:sre", "governance:human_in_loop", "escalation:required"],
                "doc_id": "pref_human_approval",
            },
            {
                "content": (
                    "Team Preference: In root cause explanations, prioritize concise evidence from metrics/logs over speculative causes. "
                    "Include blast radius and estimated time to resolve (MTTR)."
                ),
                "context": "Incident Response Style Guide",
                "tags": ["team:sre", "style:evidence_based"],
                "doc_id": "pref_explanation_style",
            }
        ]

        for p in preferences:
            self.remember(
                bank_id="team-preferences",
                content=p["content"],
                context=p["context"],
                tags=p["tags"],
                document_id=p["doc_id"],
                fact_type="world"
            )


# Global singleton instance
memory_service = HindsightMemoryService()
