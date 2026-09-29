# OpsMind AI - Hackathon Demo Guide (60–90 Seconds)

> **"Most AI agents answer. OpsMind remembers what happened, learns what worked, and uses that experience to respond better next time."**

---

## 1. The 60-Second Hackathon Pitch

1. **The Hook (10s)**:
   > "Every time production breaks, SREs solve it, write a post-mortem, and move on. Two weeks later, a similar incident happens, and the on-call engineer starts from scratch. Traditional AI assistants are stateless — they forget everything between incidents. We built **OpsMind AI**."

2. **The Problem (10s)**:
   > "Traditional AI gives generic advice: 'Check your logs' or 'Restart all pods'. This takes 60+ minutes of manual investigation and often causes cascading outages."

3. **The Live Demo (35s)**:
   - **Click ⚡ 1-Click Demo Mode** (or open New Incident):
     - **Incident #1 (Cold Start)**:
       Show how without memory, the agent gives 38% confidence and generic suggestions.
     - **Resolution & Learning**:
       Show SRE resolving it by rolling back deployment `v2.4.1` and submitting feedback.
       *Point to screen*: *"Watch Agent 5 (Learning Agent) retain this verified pattern into Hindsight memory."*
     - **Incident #5 (Recurrence)**:
       Submit a similar latency spike on `checkout-api`.
       *Highlight the WOW Moment*:
       **"OpsMind remembered..."**
       Past Incident $\to$ 94% Match $\to$ HikariCP pool lockup $\to$ Proven rollback fix $\to$ Tailored recommendation!
   - **Show the Action Guardrail**:
     - Demonstrate Human-in-the-Loop: SRE clicks **Approve** on the rollback command.

4. **The Punchline & Learning Evolution (15s)**:
   - Open **Learning Evolution**:
     - Show the MTTR dropping from **68 minutes down to 4 minutes** (-94%).
     - Show the confidence climbing from **38% to 98%**.
     - Show how each resolved incident converted into permanent organizational memory.

5. **Closing Statement**:
   > "OpsMind turns incident chaos into a continuously improving, autonomous organizational memory."

---

## 2. Fast Step-by-Step Demo Clickpath

| Step | Action in UI | Expected Result | Judge Takeaway |
| :--- | :--- | :--- | :--- |
| **1** | Click **"⚡ 1-Click Demo Mode"** in header | Opens guided modal with 5 steps | Demonstrates automated testing capability |
| **2** | Click **"▶ Run Automated 60s Demo"** | Steps run in sequence with real-time logs | Zero friction for judges |
| **3** | Navigate to **"AI Investigation"** | See the WOW "OpsMind remembered..." card | Visual proof of Hindsight recall |
| **4** | Toggle **"Stateless Mode"** | Watch confidence drop to 38% & warnings appear | Clear Before vs After contrast |
| **5** | Toggle back to **"Hindsight Mode"** | 94% confidence, verified rollback restored | Hindsight memory is central |
| **6** | Navigate to **"Learning Evolution"** | Inspect interactive milestones #1, #3, #5, #10 | Visually proves agent gets smarter |
| **7** | Navigate to **"Post-Mortem"** | View synthesized post-mortem & print view | Enterprise-ready DevOps product |

---

## 3. Key Differentiators to Mention

- **Not a chat log**: Uses true biomimetic memory banks (Incident, Org, Learning, Preferences) with 4-strategy retrieval (Semantic, BM25, Graph, Temporal).
- **Safety First**: Dangerous commands always require human approval (`Approve`, `Reject`, `Modify`, `Escalate`).
- **Resilient**: Works 100% reliably out of the box with embedded biomimetic fallback or connected Hindsight Cloud.
