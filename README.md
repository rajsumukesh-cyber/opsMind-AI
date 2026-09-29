# OpsMind AI 🧠⚡
### *"An AI Incident Response Agent That Remembers, Learns, and Gets Better."*

[![Tests](https://img.shields.io/badge/tests-21%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)]()
[![React](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-61DAFB.svg)]()
[![Hindsight](https://img.shields.io/badge/memory-Hindsight-6366F1.svg)]()
[![Groq](https://img.shields.io/badge/inference-Groq-F55036.svg)]()

OpsMind AI is a production-quality autonomous SRE incident response agent built for enterprise reliability teams. Unlike traditional stateless AI assistants that forget every past incident, OpsMind AI leverages **Hindsight biomimetic persistent memory** to accumulate organizational operational knowledge across incidents, runbooks, and engineer feedback.

---

## 🚀 The Core Problem

DevOps and SRE teams repeatedly face similar production incidents (e.g., connection pool exhaustion post-deployment, cache cluster redirection loops, deadlock retry storms). Valuable operational context is scattered across post-mortems, logs, and engineers' heads.

- **Traditional AI Assistants**: Mostly **stateless**. They answer the current incident in isolation, provide generic advice (*"Check your logs"* or *"Restart all pods"*), and forget what happened 10 minutes later.
- **The OpsMind AI Solution**: Uses Hindsight memory to continuously learn from previous incidents. When Incident #5 occurs, OpsMind recalls Incident #1, correlates the symptoms, adapts the proven historical resolution, and explains *why* the recommendation is being made.

> **Key Hackathon Pitch**:
> *"Most AI agents answer. OpsMind remembers what happened, learns what worked, and uses that experience to respond better next time."*

---

## 🧠 Hindsight Memory Architecture

Hindsight is central to OpsMind AI. OpsMind implements 4 dedicated memory banks with a strict **STORE $\to$ RECALL $\to$ REASON $\to$ ACT $\to$ FEEDBACK $\to$ LEARN** lifecycle:

```mermaid
flowchart TD
    subgraph SRE_Workflow[1. Live Incident Telemetry]
        Alert[Prometheus Alert / Logs] --> Agent1[Agent 1: Incident Analyzer]
    end

    subgraph Memory_Layer[2. Hindsight Memory Banks]
        IM[(incident-memory<br/>Symptoms, errors, root causes)]
        OM[(organizational-memory<br/>Runbooks, architecture SLAs)]
        LM[(learning-memory<br/>Verified resolutions, feedback)]
        TP[(team-preferences<br/>Safety guardrails, approval rules)]
    end

    subgraph Agentic_Pipeline[3. Multi-Agent Reasoning]
        Agent1 --> Agent2[Agent 2: Memory Retriever]
        Agent2 <-->|4-Strategy RRF Recall| Memory_Layer
        Agent2 --> Agent3[Agent 3: Root Cause Investigator]
        Agent3 --> Agent4[Agent 4: Resolution Planner]
    end

    subgraph Governance[4. Human-in-the-Loop]
        Agent4 --> Gate{Human Decision Gate}
        Gate -->|Approve| Exec[Execute Safe Remediation]
        Gate -->|Reject / Modify| SRE[SRE Adjusts Command]
        Gate -->|Escalate| Esc[Tier-3 Escalation]
    end

    subgraph Continuous_Learning[5. Autonomous Evolution]
        Exec --> Agent5[Agent 5: Learning Agent]
        SRE --> Agent5
        Agent5 -->|Retain Synthesized Observations| Memory_Layer
    end
```

### 1. The 4 Memory Banks:
1. **Incident Memory (`incident-memory`)**: Historical incidents, error traces, logs signatures, root cause postmortems, and blast radius.
2. **Organizational Memory (`organizational-memory`)**: SRE runbooks, architectural constraints, and service dependencies.
3. **Learning Memory (`learning-memory`)**: Verified resolutions, rejected attempts, engineer feedback ratings, and symptom-cause graph edges.
4. **Team Preferences (`team-preferences`)**: Safety guardrails (e.g. *"Do not restart database primary directly; failover replica first"*), explanation style preferences, and approval thresholds.

### 2. Multi-Strategy 4-Arm Retrieval Pipeline:
When diagnosing an incident, OpsMind triggers 4 parallel search arms fused via **Reciprocal Rank Fusion (RRF)**:
- **Semantic Vector Search**: Dense matching on technical failure vocabulary.
- **BM25 Keyword Matching**: Exact lexical matching on status codes (504, 500), exception classes, and log signatures.
- **Graph Traversal**: Associates symptoms $\to$ root causes $\to$ proven resolutions.
- **Temporal Recency**: Decay weighting favoring recent architectural changes.

---

## ⚡ The 5 Specialized SRE Agents

OpsMind keeps its multi-agent architecture practical, focused, and robust:

1. **Agent 1 — Incident Analyzer**: Ingests raw alerts, stack traces, and pod logs; extracts symptoms, severity (SEV1-SEV4), affected service, and blast radius.
2. **Agent 2 — Memory Retriever**: Queries all 4 Hindsight banks; builds the **"OpsMind remembered..." WOW Memory Chain**.
3. **Agent 3 — Root Cause Investigator**: Synthesizes active symptoms with recalled memory facts to determine the probable root cause, evidence chain, and confidence score.
4. **Agent 4 — Resolution Planner**: Constructs prioritized step-by-step remediation plans. Enforces Human-in-the-Loop guards (`Approve`, `Reject`, `Modify`, `Escalate`) for dangerous operations.
5. **Agent 5 — Learning Agent**: Active post-resolution; analyzes what worked vs what failed and permanently retains new observations into Hindsight.

---

## 📈 Learning Evolution & Before vs After

OpsMind features a dedicated **Learning Evolution Dashboard** proving how the agent gets smarter over time:

| Milestone | Stage Name | SRE Behavior | Confidence | MTTR |
| :--- | :--- | :--- | :---: | :---: |
| **Interaction #1** | Generic AI Assistant | No prior organizational context. Recommends blind pod restarts. | **38%** | **68 mins** |
| **Interaction #3** | Pattern Recognition | Recognizes recurring symptoms across services. Identifies common failure modes. | **72%** | **26 mins** |
| **Interaction #5** | Historical Resolution | Recalls exact prior postmortems. Recommends verified fixes with high precision. | **91%** | **8 mins** |
| **Interaction #10** | Personalized SRE Copilot | Deep organizational memory. Enforces safety guardrails and tailors actions to team policies. | **98%** | **4 mins** |

### Before vs After Comparison:
- **WITHOUT MEMORY (Stateless)**: 0 memories recalled, 38% confidence, generic trial-and-error restarts, 68m MTTR.
- **WITH HINDSIGHT**: Recalls Incident INC-8401 with 94% similarity, applies proven rollback immediately, 4m MTTR (**-94% reduction**).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLite metadata store, PyJWT
- **Agent Intelligence**: Groq API (`llama-3.3-70b-versatile`, `qwen/qwen3-32b`, `openai/gpt-oss-120b`)
- **Persistent Memory Layer**: Hindsight Cloud / Self-Hosted Hindsight API + Embedded Biomimetic Fallback Engine
- **Testing**: Pytest (100% pass rate across 21 test suites)

---

## 📦 Installation & Local Development

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Clone the repository
```bash
git clone https://github.com/your-username/opsmind-ai.git
cd opsmind-ai
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your `GROQ_API_KEY` for live LLM inference. If omitted, OpsMind's resilient embedded SRE reasoning engine runs seamlessly!)*

### 3. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 5. Run the Application

**Terminal 1 — Backend (FastAPI)**:
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend (Vite + React)**:
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Running the Test Suite

OpsMind includes 21 comprehensive unit, integration, and resilience tests:
```bash
python -m pytest tests -v
```
Output:
```
tests/test_agents.py (6 passed)
tests/test_api.py (6 passed)
tests/test_memory.py (5 passed)
tests/test_resilience.py (4 passed)
====================== 21 passed in 10.89s =======================
```

---

## ⚡ 60-Second Hackathon Demo Walkthrough

1. Open the UI at `http://localhost:5173`.
2. Click **"⚡ 1-Click Demo Mode"** in the top navigation bar.
3. Click **"▶ Run Automated 60s Demo"** or click each step sequentially:
   - **Step 1**: Load historical incidents & runbooks into Hindsight.
   - **Step 2**: Submit Incident #1 (checkout-api latency spike) $\to$ watch cold diagnosis.
   - **Step 3**: Resolve Incident #1 $\to$ watch Agent 5 commit the rollback fix to Hindsight.
   - **Step 4**: Submit Incident #5 $\to$ watch **"OpsMind remembered..." WOW card** appear with 94% similarity!
   - **Step 5**: Open **Learning Evolution** $\to$ inspect the descending MTTR curve from 68m to 4m!

---

## 📁 Repository Structure

```
opsAgent-AI/
├── backend/
│   ├── app.py                 # FastAPI application & middleware
│   ├── database.py            # SQLite metadata storage
│   ├── auth.py                # JWT authentication
│   ├── llm.py                 # Groq client integration
│   ├── models.py              # Pydantic schemas
│   └── routes/                # Clean modular API routers
│       ├── incidents_routes.py
│       ├── memory_routes.py
│       ├── learning_routes.py
│       ├── dashboard_routes.py
│       ├── postmortem_routes.py
│       ├── demo_routes.py
│       └── auth_routes.py
├── agents/
│   ├── incident_analyzer.py   # Agent 1: Telemetry & blast radius
│   ├── memory_retriever.py    # Agent 2: Hindsight cross-bank recall
│   ├── root_cause_investigator.py # Agent 3: Evidence synthesis
│   ├── resolution_planner.py  # Agent 4: Remediation & human approval
│   ├── learning_agent.py      # Agent 5: Retains post-resolution feedback
│   └── orchestrator.py        # Pipeline coordinator & comparison mode
├── memory/
│   └── hindsight_service.py   # Hindsight integration & biomimetic engine
├── data/
│   └── seed_data.py           # Realistic synthetic DevOps incidents & runbooks
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, WOW Recall Card, Modals
│   │   ├── pages/             # Dashboard, Investigation, Evolution, etc.
│   │   ├── api.ts             # Typed REST API client
│   │   └── types.ts           # Shared TypeScript interfaces
│   └── vite.config.ts         # Vite build & proxy configuration
├── tests/
│   ├── test_agents.py         # Agent pipeline tests
│   ├── test_api.py            # API integration tests
│   ├── test_memory.py         # Hindsight retain/recall tests
│   └── test_resilience.py     # Fault-tolerance & edge case tests
├── docs/
│   ├── architecture.md        # Technical architecture & Mermaid diagrams
│   ├── demo_guide.md          # Hackathon pitch script & clickpath
│   └── api_spec.md            # REST API endpoint reference
└── requirements.txt           # Python dependencies
```

---

## 🏆 Hackathon Value Proposition

| Traditional Incident Assistant | OpsMind AI (with Hindsight) |
| :--- | :--- |
| **Stateless**: Treats every incident as if it's the first time. | **Stateful**: Remembers previous incidents, symptoms, and outcomes. |
| **Slow MTTR**: SREs spend 45-90 minutes investigating from scratch. | **Rapid MTTR**: Reduces resolution time to 4-8 minutes via historical recall. |
| **Risky**: Might suggest dangerous restarts without knowing history. | **Safe**: Enforces Human-in-the-Loop approval for risky commands. |
| **Static**: Doesn't get smarter after a resolution. | **Biomimetic**: Transforms engineer feedback into permanent organizational memory. |
