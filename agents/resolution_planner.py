"""
Agent 4: Resolution Planner
Generates prioritized remediation actions with Human-in-the-Loop guardrails.
Distinguishes between Safe automated inspection vs Dangerous production changes requiring human approval:
- Approve
- Reject
- Modify
- Escalate
"""

import json
import logging
from typing import Dict, Any, List
from backend.llm import llm_service

logger = logging.getLogger("opsmind.agent.planner")


class ResolutionPlanner:
    def plan(
        self,
        analysis: Dict[str, Any],
        investigation: Dict[str, Any],
        memory_data: Dict[str, Any],
        stateless_mode: bool = False
    ) -> Dict[str, Any]:
        """Plans remediation steps based on root cause and team safety policies."""
        service = analysis.get("service", "")
        root_cause = investigation.get("probable_root_cause", "")
        recalled_learnings = memory_data.get("recalled_learnings", []) if not stateless_mode else []
        recalled_incidents = memory_data.get("recalled_incidents", []) if not stateless_mode else []

        def fallback_plan() -> Dict[str, Any]:
            if stateless_mode:
                return {
                    "mode": "stateless",
                    "plan_type": "Generic Troubleshooting Runbook",
                    "estimated_mttr": "45 - 90 minutes",
                    "summary": "Generic multi-step investigation protocol without organizational memory.",
                    "actions": [
                        {
                            "id": "act_generic_1",
                            "step": 1,
                            "title": "Check service metrics & logs in monitoring dashboard",
                            "command": f"kubectl logs -l app={service} --tail=200",
                            "risk": "SAFE",
                            "requires_approval": False,
                            "type": "diagnostic",
                            "rationale": "Gather basic telemetry to narrow down possible causes."
                        },
                        {
                            "id": "act_generic_2",
                            "step": 2,
                            "title": "Restart all service pods to clear state",
                            "command": f"kubectl rollout restart deployment/{service}",
                            "risk": "HIGH",
                            "requires_approval": True,
                            "type": "remediation",
                            "rationale": "Brute-force restart to clear potential transient deadlocks or memory leaks."
                        },
                        {
                            "id": "act_generic_3",
                            "step": 3,
                            "title": "Manual database query performance audit",
                            "command": "psql -c 'SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity;'",
                            "risk": "SAFE",
                            "requires_approval": False,
                            "type": "diagnostic",
                            "rationale": "Inspect database activity manually if service restart fails."
                        }
                    ],
                    "memory_grounding": "None. Relying on default SRE playbook."
                }

            # Hindsight-informed targeted remediation
            actions = []
            if "pool" in root_cause.lower() or "checkout" in service:
                actions = [
                    {
                        "id": "act_pool_1",
                        "step": 1,
                        "title": "Verify active HikariCP pool lock count",
                        "command": f"curl -s http://{service}.internal:8081/actuator/metrics/hikaricp.connections.active | jq .",
                        "risk": "SAFE",
                        "requires_approval": False,
                        "type": "diagnostic",
                        "rationale": "Validate connection saturation before modifying deployment."
                    },
                    {
                        "id": "act_pool_2",
                        "step": 2,
                        "title": "Rollback deployment to stable release v2.4.0 (Recommended from INC-8401)",
                        "command": f"kubectl rollout undo deployment/{service} --to-revision=24",
                        "risk": "HIGH",
                        "requires_approval": True,
                        "type": "remediation",
                        "rationale": "INC-8401 established that rollback terminates unindexed queries holding connections, restoring p99 in <4 mins."
                    },
                    {
                        "id": "act_pool_3",
                        "step": 3,
                        "title": "Temporarily bump maximum-pool-size from 50 to 100",
                        "command": f"kubectl set env deployment/{service} SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=100",
                        "risk": "MEDIUM",
                        "requires_approval": True,
                        "type": "mitigation",
                        "rationale": "Provides buffer for pending requests while traffic stabilizes."
                    }
                ]
                mttr = "4 - 8 minutes"
                summary = "Targeted rollback & pool expansion adapted directly from successful resolution of INC-8401."

            elif "redis" in root_cause.lower() or "auth" in service:
                actions = [
                    {
                        "id": "act_redis_1",
                        "step": 1,
                        "title": "Verify current Redis Sentinel master IP",
                        "command": "redis-cli -p 26379 sentinel get-master-addr-by-name mymaster",
                        "risk": "SAFE",
                        "requires_approval": False,
                        "type": "diagnostic",
                        "rationale": "Confirm current healthy Redis master node address."
                    },
                    {
                        "id": "act_redis_2",
                        "step": 2,
                        "title": "Apply networkaddress.cache.ttl=10 ConfigMap patch",
                        "command": "kubectl apply -f k8s/auth-service/configmap-dns-ttl.yaml",
                        "risk": "MEDIUM",
                        "requires_approval": True,
                        "type": "configuration",
                        "rationale": "Learned from INC-7922: Prevents JVM from caching old master IP permanently."
                    },
                    {
                        "id": "act_redis_3",
                        "step": 3,
                        "title": "Execute rolling restart of auth-service pods",
                        "command": f"kubectl rollout restart deployment/{service}",
                        "risk": "HIGH",
                        "requires_approval": True,
                        "type": "remediation",
                        "rationale": "Forces fresh socket connection establishment to new Redis master."
                    }
                ]
                mttr = "3 - 5 minutes"
                summary = "DNS TTL fix and rolling socket refresh adapted from INC-7922 post-mortem."

            elif "deadlock" in root_cause.lower() or "payment" in service:
                actions = [
                    {
                        "id": "act_deadlock_1",
                        "step": 1,
                        "title": "Inspect pg_locks for transaction conflicts",
                        "command": "psql -c \"SELECT pid, relation::regclass, mode, granted FROM pg_locks WHERE NOT granted;\"",
                        "risk": "SAFE",
                        "requires_approval": False,
                        "type": "diagnostic",
                        "rationale": "Confirm whether lock contention is actively blocking threads."
                    },
                    {
                        "id": "act_deadlock_2",
                        "step": 2,
                        "title": "Enable Redis distributed idempotency lock with 60s TTL",
                        "command": "kubectl patch deployment/payment-gateway -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"payment\",\"env\":[{\"name\":\"ENABLE_REDIS_IDEMPOTENCY\",\"value\":\"true\"}]}]}}}}'",
                        "risk": "MEDIUM",
                        "requires_approval": True,
                        "type": "remediation",
                        "rationale": "Learned from INC-9104: Serializes duplicate webhook payloads and eliminates deadlock on user_balance."
                    }
                ]
                mttr = "5 - 10 minutes"
                summary = "Idempotency serialization adapted from INC-9104 (avoids risky DB connection increase)."
            else:
                actions = [
                    {
                        "id": "act_custom_1",
                        "step": 1,
                        "title": "Collect targeted subsystem diagnostics",
                        "command": f"kubectl top pod -l app={service}",
                        "risk": "SAFE",
                        "requires_approval": False,
                        "type": "diagnostic",
                        "rationale": "Confirm resource constraints matching historical profile."
                    },
                    {
                        "id": "act_custom_2",
                        "step": 2,
                        "title": "Apply verified mitigation patch from Hindsight memory bank",
                        "command": f"kubectl rollout undo deployment/{service}",
                        "risk": "HIGH",
                        "requires_approval": True,
                        "type": "remediation",
                        "rationale": "Historical resolution verified by on-call SRE in previous post-mortem."
                    }
                ]
                mttr = "8 - 15 minutes"
                summary = "Hindsight-grounded resolution targeting verified past fix."

            return {
                "mode": "hindsight",
                "plan_type": "Hindsight-Optimized Remediation Plan",
                "estimated_mttr": mttr,
                "summary": summary,
                "actions": actions,
                "memory_grounding": f"Grounded in {len(recalled_incidents)} matching incident(s) and team governance rules."
            }

        if llm_service.is_configured():
            system_prompt = (
                "You are Agent 4 (Resolution Planner) for OpsMind AI. "
                "Produce a step-by-step remediation plan with commands, risk levels (SAFE/MEDIUM/HIGH), "
                "and requires_approval flags for dangerous operations. Return JSON with: "
                "plan_type (str), estimated_mttr (str), summary (str), actions (list of action objects), memory_grounding (str)."
            )
            user_prompt = (
                f"Stateless Mode: {stateless_mode}\n"
                f"Service: {service}\nRoot Cause: {root_cause}\n"
                f"Investigation: {json.dumps(investigation)}\n"
            )
            return llm_service.generate_json(system_prompt, user_prompt, fallback_generator=fallback_plan)

        return fallback_plan()
