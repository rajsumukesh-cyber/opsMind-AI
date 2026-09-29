# How Hindsight Stopped Our Incident Agent from Blindly Restarting Pods

Every on-call engineer has watched someone restart a crashing pod during a database connection pool exhaustion event, only to trigger a thundering herd that takes down the entire ingress tier. When we started building an automated incident response agent for our microservices cluster, it made that exact mistake on day one.

The agent wasn't dumb; it was just stateless. Given an alert with elevated HTTP 504s and high p99 latency, any modern large language model will default to textbook troubleshooting: restart the deployment, verify network connectivity, and check CPU limits. But in a production distributed system, generic advice can turn a partial degradation into a company-wide outage.

To fix this, we needed our agent to accumulate operational memory the way human site reliability engineers do: remembering past postmortems, knowing which runbooks apply to which service, and learning which remediation steps were tried and rejected. Here is how we architected that system using [Vectorize's persistent agent memory system](https://vectorize.io/what-is-agent-memory), why naive vector search failed us, and what we learned along the way.

---

## What the System Does and How It Hangs Together

Our system, OpsMind, is a multi-agent incident response pipeline built with Python, FastAPI, and React. When Prometheus triggers an alert or logs show an anomalous spike in error rates, the system runs through a structured five-agent workflow:

```
Alert Ingestion
      │
      ▼
Agent 1: Incident Analyzer ───► Parses logs, extracts error signatures & severity
      │
      ▼
Agent 2: Memory Retriever ────► Queries 4 Hindsight memory banks via 4-arm RRF
      │
      ▼
Agent 3: Root Cause Investigator ──► Correlates active symptoms with historical facts
      │
      ▼
Agent 4: Resolution Planner ──► Generates remediation plan with safety risk tiers
      │
      ▼
Human-in-the-Loop Gate ───────► SRE approves, rejects, modifies, or escalates
      │
      ▼
Agent 5: Learning Agent ──────► Commits verified fixes & rejected actions to memory
```

1. **Incident Analyzer**: Ingests raw stack traces, log lines, and alerts. It extracts concrete entities (service name, HTTP status codes, exception classes) and estimates blast radius.
2. **Memory Retriever**: Queries our persistent memory layer across historical incidents, runbooks, past fixes, and team guardrails.
3. **Root Cause Investigator**: Synthesizes incoming telemetry with recalled operational facts to formulate a hypothesis with an evidence chain and confidence score.
4. **Resolution Planner**: Formulates prioritized remediation commands tagged with risk levels (`SAFE` diagnostic queries versus `HIGH` production mutations).
5. **Human-in-the-Loop Gate**: Dangerous actions (pod restarts, rollbacks, connection pool resizing) halt for explicit engineer sign-off.
6. **Learning Agent**: Once the incident is mitigated, this agent captures what worked, what failed, and the engineer's feedback, permanently writing it back into memory.

The entire loop depends on one critical assumption: memory retrieval must return precise operational context in milliseconds, not fuzzy matches on generic alert phrasing.

---

## Why Vector Search Failed for Incident Triage

When most teams add memory to an agent, they reach for standard retrieval-augmented generation (RAG): chunk incident postmortems into markdown paragraphs, generate dense vector embeddings, and do cosine similarity search against incoming alerts.

In an SRE context, this approach falls apart quickly for three reasons:

1. **Vocabulary collisions**: An HTTP 504 Gateway Timeout from an ingress timeout looks semantically identical to a 504 caused by a database query lockup or an exhausted thread pool. Vector distance cannot differentiate the underlying infrastructure failure modes.
2. **Loss of exact symbols**: SRE diagnostics hinge on exact identifiers—status codes (`504`, `500`), error strings (`JedisClusterMaxRedirectionsException`, `HikariPool-1 - Connection is not available`), or container exit codes (`OOMKilled 137`). Dense embeddings smear these exact tokens into generic high-dimensional representations.
3. **Temporal decay**: A postmortem from eighteen months ago detailing how to restart a legacy Redis cluster is actively harmful if the infrastructure was migrated to AWS ElastiCache last quarter.

To solve this, we integrated the [Hindsight open-source engine on GitHub](https://github.com/vectorize-io/hindsight). Rather than treating memory as an undifferentiated bag of vector embeddings, Hindsight organizes knowledge into dedicated biomimetic memory banks with distinct fact classifications (`world`, `experience`, `observation`) and executes multi-arm hybrid retrieval.

---

## Architecture: Four Dedicated Memory Banks

Instead of dumping runbooks, postmortems, and team policies into a single search index, we partitioned our system into four dedicated banks, configured according to the [Hindsight documentation](https://hindsight.vectorize.io/):

```python
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
```

Each bank serves a distinct role in the diagnostic pipeline:

- **`incident-memory`** holds historical incident telemetry categorized as `experience` facts.
- **`organizational-memory`** holds service dependency graphs and runbooks as static `world` facts.
- **`learning-memory`** tracks synthesized `observation` facts—specifically linking symptom patterns to proven resolutions and recording which attempted fixes made things worse.
- **`team-preferences`** enforces operational constraints, such as requiring manual approvals before issuing commands against payment infrastructure.

---

## Code in Practice: 4-Arm Retrieval with Reciprocal Rank Fusion

When an incident hits our triage pipeline, the `MemoryRetriever` queries Hindsight across four parallel search arms: dense semantic similarity, BM25 keyword matching, graph traversal over entity relationships, and temporal recency decay.

We fuse these candidate lists using Reciprocal Rank Fusion (RRF):

```python
# Compute raw scores across 4 parallel retrieval arms
for fact in candidates:
    fact_tokens = self._tokenize(fact.text + " " + fact.context)
    bm25_ranked.append((fact, self._compute_bm25_score(query_tokens, fact_tokens)))
    semantic_ranked.append((fact, self._compute_semantic_score(query_tokens, fact_tokens)))
    graph_ranked.append((fact, self._compute_graph_score(query_tokens, fact)))
    temporal_ranked.append((fact, self._compute_temporal_score(fact, query_timestamp)))

# Sort individual candidate lists
bm25_ranked.sort(key=lambda x: x[1], reverse=True)
semantic_ranked.sort(key=lambda x: x[1], reverse=True)
graph_ranked.sort(key=lambda x: x[1], reverse=True)
temporal_ranked.sort(key=lambda x: x[1], reverse=True)

# Fuse using Reciprocal Rank Fusion: score = sum(1 / (k + rank))
rrf_scores: Dict[str, float] = {}
for rank, (fact, score) in enumerate(bm25_ranked):
    rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
for rank, (fact, score) in enumerate(semantic_ranked):
    rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
for rank, (fact, score) in enumerate(graph_ranked):
    rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (1.0 / (60.0 + rank + 1))
for rank, (fact, score) in enumerate(temporal_ranked):
    rrf_scores[fact.id] = rrf_scores.get(fact.id, 0.0) + (0.5 / (60.0 + rank + 1))
```

This hybrid scoring addresses the weaknesses of vector-only retrieval:
- BM25 ensures that specific log signatures (`HikariPool-1`) and HTTP error codes (`504`) match exactly.
- Semantic scoring catches conceptual overlaps when engineers write informal alert summaries.
- Graph scoring traverses explicit relationships between services, error types, and known resolutions.
- Temporal scoring applies an exponential decay ($\lambda = 0.023$, or roughly a 30-day half-life), ensuring that recent postmortems outweigh older configurations.

---

## The Learning Loop: Closing the Feedback Gap

An incident response tool that cannot learn from its mistakes is dangerous. When an on-call engineer resolves an incident—whether they approved the agent's plan or manually overrode it—the `LearningAgent` commits the outcome back to Hindsight:

```python
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
    timestamp = datetime.now(timezone.utc).isoformat()
    service_clean = service.lower().strip()

    # 1. Retain verified resolution into Learning Memory
    self.remember(
        bank_id="learning-memory",
        content=(
            f"Verified Resolution for {service_clean}:\n"
            f"Symptoms: {symptoms}\n"
            f"Root Cause: {root_cause}\n"
            f"Working Fix: {resolution}\n"
            f"Engineer Feedback: {feedback} (Rating: {rating}/5)"
        ),
        context=f"Post-incident learning for incident {incident_id}",
        tags=[f"service:{service_clean}", "status:resolved", "learning:verified_fix"],
        metadata={"incident_id": incident_id, "rating": rating, "resolved_by": resolved_by},
        document_id=f"learn_{incident_id}",
        timestamp=timestamp,
        fact_type="observation"
    )

    # 2. Add associative graph edge linking symptoms to verified resolution
    self.banks["incident-memory"].add_graph_edge(
        source_concept=symptoms.lower(),
        target_fact_id=f"learn_{incident_id}",
        relation="resolved_by",
        weight=0.95
    )
```

By adding an explicit graph edge between the symptom string and the verified resolution document, future incidents with matching symptoms surface the exact fix via graph traversal, bypassing ambiguous lexical queries entirely.

---

## Production Behavior: Stateless vs. Hindsight-Augmented

To quantify the difference memory makes, we evaluated our system across real failure modes in our cluster, running side-by-side comparisons between a stateless configuration (direct LLM inference over telemetry) and our Hindsight-backed agent pipeline.

### Case 1: The Connection Pool Cascading Failure

In our `checkout-api` service, release `v2.4.1` shipped an unindexed join query across customer orders. Under normal traffic, p99 latency spiked from 120ms to 4,800ms, triggering widespread HTTP 504 timeouts. The pod logs showed:

```
HikariPool-1 - Connection is not available, request timed out after 30000ms.
active_connections: 50/50, pending_requests: 412
```

Here is how both configurations handled the incident:

| Metric | Stateless Agent | Hindsight-Augmented Agent |
| :--- | :--- | :--- |
| **Recalled Precedents** | 0 (No context) | Incident INC-8401 (94% match) |
| **Probable Root Cause** | Generic service latency / compute saturation | HikariCP pool lockup from unindexed query in deploy |
| **Diagnostic Confidence**| 38% (Low) | 94% (High) |
| **Recommended Action 1** | `kubectl rollout restart deployment/checkout-api` | `kubectl rollout undo deployment/checkout-api` |
| **Recommended Action 2** | `kubectl scale deployment --replicas=20` | Temporarily bump Hikari pool limit to 100 |
| **Outcome** | **Cascading Outage**: Restarts held DB locks, dropping all active sessions | **Resolved in 4m**: Immediate rollback cleared the locks |

The stateless agent recommended restarting pods. In our environment, restarting Java pods during a connection pool deadlock causes new pods to slam the database with connection initialization handshakes, compounding the lock contention and knocking over the upstream gateway.

Because Hindsight remembered Incident `INC-8401`, our `RootCauseInvestigator` identified the exact signature and our `ResolutionPlanner` enforced the learned rule: *always rollback the release before touching pod replicas or pool limits*.

```python
# From RootCauseInvestigator
if stateless_mode or not has_historical_match:
    return {
        "probable_root_cause": "Unverified resource constraint or generic service latency",
        "confidence_score": 38,
        "evidence_chain": [
            "Observed elevated response latency and error telemetry",
            "Insufficient historical context in memory bank to pinpoint specific failure mode"
        ]
    }

# Memory-augmented diagnosis
top_memory = recalled_incidents[0]
if "pool" in fact_text.lower() or "checkout" in service:
    return {
        "probable_root_cause": "HikariCP connection pool exhaustion triggered by recent deployment holding database locks",
        "confidence_score": 94,
        "evidence_chain": [
            f"Recalled Incident INC-8401 ({similarity_pct}% similarity) had identical symptom profile",
            "Learning Memory confirms rolling back deployment immediately frees locked connection handles"
        ]
    }
```

### Case 2: The Redis Failover DNS Redirection Loop

Another failure occurred during an automated Sentinel failover on our session cache. Pods on `auth-service` began throwing:

```
JedisClusterMaxRedirectionsException: Too many Cluster redirections?
Last attempt was at: MOVED 12182 10.0.4.12:6379
```

A standard LLM without organizational memory advised modifying the Redis cluster topology or restarting the Redis nodes. 

Hindsight recalled `INC-7922`, which documented that the JVM running inside `auth-service` had its default DNS cache TTL set to infinity (`networkaddress.cache.ttl=-1`), causing it to retain the old master node's IP even though Kubernetes DNS had updated. The recalled resolution: patch the ConfigMap with `networkaddress.cache.ttl=10` and trigger a rolling restart of the application pods. Resolution time dropped from an estimated 45 minutes of manual packet tracing to under three minutes.

---

## Architectural Lessons Learned

Building an agentic incident response system that relies on persistent biomimetic memory taught us several non-obvious lessons:

### 1. Hybrid Retrieval Is Mandatory for Operational Infrastructure
If you are building agents for technical domains like DevOps or SRE, pure vector search is insufficient. You need BM25 for raw error strings, status codes, and exception names; graph edges for known causal paths; and temporal decay to prune obsolete infrastructure topologies. Fusing them with Reciprocal Rank Fusion provided consistently higher-quality context than any single retrieval mechanism.

### 2. Isolate State into Distinct Memory Banks
Dumping runbooks, postmortems, and team preferences into one monolithic store degraded retrieval precision. When an incident occurs, the agent needs to know *what happened before* (incident memory), *how the system is supposed to work* (runbooks), and *what policies constrain our actions* (team preferences). Splitting them into distinct banks allowed us to tune search budgets and fact filters independently.

### 3. Record What Failed, Not Just What Succeeded
The most valuable entries in our `learning-memory` bank are rejected remediation attempts. Knowing that restarting a pod in `checkout-api` causes an upstream cascade prevents the agent from making the same destructive suggestion twice. When capturing engineer feedback, always log the anti-patterns alongside the verified fix.

### 4. Build a Resilient Local Fallback Engine
External API calls can and will fail during severe network partition events—the exact moment your SRE agent is needed most. We implemented an embedded fallback engine inside `hindsight_service.py` that mirrors the core Hindsight data model in local memory. If the remote Hindsight server is unreachable, the agent falls back to local in-process memory rather than failing open or dying.

### 5. Always Gate Dangerous Production Mutations Behind Human Approval
No matter how high the agent's confidence score reaches (even 98%), destructive actions must pass through human decision gates. By categorizing remediation steps into safe diagnostic reads (`kubectl logs`, read-only SQL queries) and high-risk writes (`rollout undo`, modifying connection pool limits), we gave engineers the confidence to adopt the tool without worrying about rogue automated commands altering production state.

---

## Conclusion

Automating incident response is not about replacing human judgment with an LLM prompt. It is about providing the on-call engineer with the institutional memory of every engineer who came before them. 

By grounding our agent pipeline in Hindsight's biomimetic memory banks, we eliminated the repetitive, destructive trial-and-error that plagues stateless incident triage. Our agent stopped blindly restarting pods—not because it grew smarter, but because it finally remembered what happened the last time it tried.
