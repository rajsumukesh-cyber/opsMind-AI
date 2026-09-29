"""
Agent 1: Incident Analyzer
Extracts affected service, severity (SEV1-SEV4), symptoms, error codes, logs signature, and blast radius.
"""

import re
import json
import logging
from typing import Dict, Any, List
from backend.llm import llm_service

logger = logging.getLogger("opsmind.agent.analyzer")


class IncidentAnalyzer:
    def analyze(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyzes raw incident payload and normalizes telemetry."""
        service = incident_data.get("service", "unknown-service").lower().strip()
        title = incident_data.get("title", "")
        description = incident_data.get("description", "")
        logs = incident_data.get("logs", "")
        metrics = incident_data.get("metrics", {})
        environment = incident_data.get("environment", "production")

        def fallback_analysis() -> Dict[str, Any]:
            # Rule-based telemetry extraction
            combined_text = f"{title} {description} {logs}".lower()
            
            # Severity classification
            severity = "SEV2"
            if any(term in combined_text for term in ["outage", "deadlock", "all requests failing", "down", "critical", "500"]):
                severity = "SEV1"
            elif any(term in combined_text for term in ["latency", "slow", "warning", "retry", "degraded"]):
                severity = "SEV2"
            elif any(term in combined_text for term in ["intermittent", "minor"]):
                severity = "SEV3"

            # Symptoms extraction
            symptoms = []
            if "latency" in combined_text or "timeout" in combined_text or "slow" in combined_text:
                symptoms.append("Elevated p99 latency & upstream request timeouts")
            if "pool" in combined_text or "connection" in combined_text or "exhaust" in combined_text:
                symptoms.append("Database connection pool saturation")
            if "oom" in combined_text or "memory" in combined_text or "kill" in combined_text:
                symptoms.append("Container Memory exhaustion / OOMKilled events")
            if "deadlock" in combined_text or "lock" in combined_text:
                symptoms.append("Database row lock contention / deadlock")
            if "504" in combined_text or "gateway timeout" in combined_text:
                symptoms.append("HTTP 504 Gateway Timeouts on critical endpoints")
            if "500" in combined_text or "internal error" in combined_text:
                symptoms.append("HTTP 500 Internal Server Errors")
            if not symptoms:
                symptoms.append("Anomalous error rate observed on service telemetry")

            # Error signatures
            error_signatures = []
            err_patterns = [
                r'(?:Exception|Error):\s*([^\n\r]+)',
                r'(?:HTTP\s*)?(50[0-4])',
                r'([A-Za-z0-9_]+Exception)',
                r'(deadlock detected[^\n\r]*)',
                r'(Out of memory[^\n\r]*)',
            ]
            for pat in err_patterns:
                matches = re.findall(pat, logs, re.IGNORECASE)
                for m in matches[:3]:
                    error_signatures.append(str(m).strip())

            # Blast radius
            blast_radius = "Single microservice degraded"
            if severity == "SEV1":
                blast_radius = f"Critical impact on {service} and cascading dependencies across {environment}"
            elif severity == "SEV2":
                blast_radius = f"Degraded response times for users touching {service} workflows"

            return {
                "service": service,
                "severity": severity,
                "symptoms": symptoms,
                "error_signatures": list(set(error_signatures)) or ["Unspecified telemetry degradation"],
                "blast_radius": blast_radius,
                "environment": environment,
                "telemetry_summary": f"Service: {service} | Severity: {severity} | Symptoms: {', '.join(symptoms[:2])}",
            }

        system_prompt = (
            "You are Agent 1 (Incident Analyzer) for OpsMind AI. "
            "Analyze the given incident description and logs. "
            "Return JSON with: service, severity (SEV1-SEV4), symptoms (list of strings), "
            "error_signatures (list of strings), blast_radius (string), telemetry_summary (string)."
        )
        user_prompt = f"Title: {title}\nDescription: {description}\nLogs:\n{logs}\nMetrics: {json.dumps(metrics)}"

        return llm_service.generate_json(system_prompt, user_prompt, fallback_generator=fallback_analysis)
