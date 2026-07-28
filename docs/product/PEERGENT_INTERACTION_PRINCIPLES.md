# Peergent Interaction Principles

**Status:** Product behavior specification (Sprint 29A.1)  
**Authority:** Subordinate to [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md) and [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md).  
**Scope:** HQ, Command Center, Peer workspaces, notifications, future autonomous actions.

The product must feel: **calm · premium · human · trustworthy · competent · proactive without intrusion**.

---

## 1. Non-negotiable principles

### 1. Attention is expensive

| | |
|-|-|
| **Means** | Every pixel and ping must earn its place. |
| **Correct** | Show only what changes a decision or reassures honestly. |
| **Incorrect** | Badges, banners, and “updates” with no user value. |
| **Example** | One “Waiting for you” row with Review — not three reminders. |
| **UI** | Minimize sections; omit empty blocks. |
| **Notifications** | Decision-required only by default. |
| **Autonomy** | Internal retries silent unless outcome affects customer. |

### 2. One clear primary action

| | |
|-|-|
| **Means** | Each screen state has at most one dominant CTA. |
| **Correct** | “Review 3 items” in presence header. |
| **Incorrect** | Review + Continue campaign + Start + View details equally weighted. |
| **UI** | Primary button; secondary ghost/link. |
| **Notifications** | Single deep link to the decision surface. |
| **Autonomy** | Auto-continue only when policy explicitly allows and customer was informed. |

### 3. Silence is a valid state

| | |
|-|-|
| **Means** | No noise when caught up. |
| **Correct** | “I don’t need anything from you right now.” |
| **Incorrect** | Tips, upsells, or synthetic activity feeds. |
| **UI** | Hide Waiting for me section when empty. |
| **Notifications** | None. |
| **Autonomy** | Peer waits quietly until trigger. |

### 4. Progressive disclosure

| | |
|-|-|
| **Means** | Depth on demand, not upfront. |
| **Correct** | History & details collapsed on review page. |
| **Incorrect** | Version timeline on every list card. |
| **UI** | `<details>`, sheets, “Open full campaign”. |
| **Notifications** | Link to summary first, not JSON. |
| **Autonomy** | Admin sees full trace; customer sees outcome. |

### 5. Outcomes before process

| | |
|-|-|
| **Means** | Lead with what was delivered or needed. |
| **Correct** | “Campaign strategy approved.” |
| **Incorrect** | “Work unit transitioned to review_ready.” |
| **UI** | Done section narrative; process in admin. |
| **Notifications** | “Strategy ready for your review.” |
| **Autonomy** | Log process internally only. |

### 6. Ask only when needed

| | |
|-|-|
| **Means** | No confirmation dialogs for reversible safe actions; ask at real boundaries. |
| **Correct** | Approve modal before commitment. |
| **Incorrect** | “Are you sure?” on every navigation. |
| **UI** | Modals at approval/reject/publish gates. |
| **Notifications** | Only when input truly required. |
| **Autonomy** | Default deny on irreversible external actions. |

### 7. Never fake certainty

| | |
|-|-|
| **Means** | If data or quality is uncertain, say so plainly. |
| **Correct** | “I’m not fully certain about reach estimates — here’s my assumption.” |
| **Incorrect** | Precise fake numbers. |
| **UI** | Confidence cues in disclosure, not headline. |
| **Notifications** | Rare; factual. |
| **Autonomy** | Escalate to human when below quality threshold. |

### 8. Safe autonomy

| | |
|-|-|
| **Means** | Peers act within policy; stop at approval and integration boundaries. |
| **Correct** | Continue after approval when mode allows. |
| **Incorrect** | Publish or spend budget without approval. |
| **UI** | Readiness states honest (“Publishing not available yet”). |
| **Notifications** | Notify on blocked autonomy, not every internal step. |
| **Autonomy** | Continuation runner respects existing decision maps. |

### 9. Reversible actions where possible

| | |
|-|-|
| **Means** | Prefer request-changes over destructive paths; clarify reject consequences. |
| **Correct** | “Send back for revision” vs hard delete. |
| **Incorrect** | Irreversible reject with no explanation. |
| **UI** | Destructive tertiary styling for Reject. |
| **Notifications** | N/A unless reject stalls engagement. |
| **Autonomy** | No silent data loss. |

### 10. Explain failures in human language

| | |
|-|-|
| **Means** | Needs help state + one next step. |
| **Correct** | “I couldn’t finish after several tries.” |
| **Incorrect** | Stack traces, error codes in customer UI. |
| **UI** | Failed safely presence; admin gets detail. |
| **Notifications** | One alert per failure class, deduped. |
| **Autonomy** | Stop retry storm; preserve artifacts. |

### 11. Preserve context

| | |
|-|-|
| **Means** | Return user to same engagement/deliverable after action. |
| **Correct** | Approve → next in queue or campaign with banner. |
| **Incorrect** | Dump on unrelated dashboard. |
| **UI** | Breadcrumbs: Back to campaign; queue position. |
| **Notifications** | Deep link includes Peer + item. |
| **Autonomy** | Decisions stay tied to work unit in storage (unchanged architecture). |

### 12. Do not make the customer manage internal machinery

| | |
|-|-|
| **Means** | No work units, executors, or planner in default UX. |
| **Correct** | Settings in human categories. |
| **Incorrect** | “Restart continuation” button for founders. |
| **UI** | Admin inspector for machinery. |
| **Notifications** | Never mention executor. |
| **Autonomy** | Ops in admin/dev only. |

---

## 2. Interruption levels

| Level | Meaning | Badge | In-app notification | Email/push (future) | May interrupt? | CTA |
|-------|---------|-------|---------------------|---------------------|----------------|-----|
| **Informational** | FYI; no action | No | Optional inbox digest | No | No | View in Done |
| **Useful but optional** | Suggestion | No | Soft inbox | Opt-in digest | No | Review suggestion |
| **Decision required** | Blocks Peer progress | Yes (count) | Yes | Yes (user prefs) | Yes (in app) | Review / Approve / Connect |
| **Urgent attention** | Failure, compliance, spend cap | Yes | Yes | Yes | Yes | Fix / View |

**Default for v1:** Only **Decision required** and **Urgent attention** get real-time badges; Informational lives in **Done** / CC “Recently completed”.

---

## 3. Empty-state philosophy

| Context | EN example | NL example |
|---------|------------|------------|
| Waiting for me empty | I don’t need anything from you right now. | Ik hoef nu niets van je. |
| Done empty (new Peer) | When I finish work, you’ll see it here. | Als ik werk afrond, zie je het hier. |
| Caught up / today complete | Everything planned for today is complete. | Alles wat voor vandaag gepland was is afgerond. |
| Scheduled pause | I’m waiting until the right time to continue. | Ik wacht tot het juiste moment om verder te gaan. |
| Results (no integrations) | Connect tools in Settings to see results here. | Koppel tools in Instellingen om resultaten te zien. |

Empty states **never** suggest the product is broken.

---

## 4. What Peers must never do

- Create fake urgency  
- Show activity to look busy  
- Duplicate notifications for the same decision  
- Ask the same question when context exists  
- Expose stack traces or internal IDs  
- Publish without required approval  
- Hide uncertainty that affects customer trust  
- Overwhelm with equal-priority choices  
- Require unnecessary configuration before first value  
- Turn every internal event into a notification  

---

## 5. Alignment with architecture (29A)

| Architecture element | Interaction alignment |
|--------------------|------------------------|
| Six-question Peer workspace | Principles apply per section; Waiting for me = Decision required |
| HQ | Informational + pulse; badge only if aggregate decisions |
| Command Center | Operating overview; no new nav model |
| Power user | Progressive disclosure — not weaker principles |
| Customer/admin | Principles **customer-only**; admin may show machinery |
| Multi-Peer | Same interruption levels; aggregate at HQ/Inbox |

No conflicting navigation introduced.

---

## 6. Related documents

- [Presence Model](./PEERGENT_PRESENCE_MODEL.md)  
- [Colleague Language](./PEERGENT_COLLEAGUE_LANGUAGE.md)  
- [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md)  
