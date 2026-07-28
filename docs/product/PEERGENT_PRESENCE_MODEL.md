# Peergent Presence Model

**Status:** Product specification (Sprint 29A.1)  
**Authority:** Subordinate to [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md), [Product Bible](../PEERGENT_PRODUCT_BIBLE.md), and [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md).  
**Scope:** Customer-facing presence only. Admin/runtime maps at bottom; never shown in default UI.

---

## 1. Purpose

One **shared presence model** for all digital colleagues so Peers feel **alive, understandable, and trustworthy** without exposing planner, executor, work units, or runtime.

**Rules (global):**

- Each Peer has **one primary customer-facing presence state** at a time.  
- Never show **Working** when no verified activity is occurring.  
- Do not create **false activity** or busy-ness for aesthetics.  
- **Red / error** only for genuine failure or required urgent attention — not for normal waiting.  
- **Caught up** must feel calm, not broken.  
- **Blocked** must say whether **the customer must act** and what happens next.  
- Distinguish **Waiting for you** (decision/input on work) from **Blocked** (environment/setup/integration/clarification).

---

## 2. Evaluation of candidate states

| Candidate | Verdict |
|-----------|---------|
| Working | **Keep** — core “colleague is on it” |
| Waiting for you | **Keep** — decision required |
| Reviewing | **Merge into Working** — narrative: “I’m revising …” (internal review of feedback, not a separate pill) |
| Preparing | **Keep** — ramp-up, setup, between phases without idle lie |
| Caught up | **Keep** — honest calm |
| Blocked | **Keep** — cannot proceed; customer or integration action |
| Needs attention | **HQ/Command Center section name only** — not a seventh Peer pill (avoids duplicate with Waiting for you). At Peer level, map to Waiting for you or Blocked. |

**Final Peer presence set (6):**  
`Waiting for you` · `Blocked` · `Working` · `Preparing` · `Caught up` · `Failed safely`

---

## 3. State definitions

### 3.1 Waiting for you

| Field | Spec |
|-------|------|
| **EN label** | Waiting for you |
| **NL label** | Wacht op jou |
| **Meaning** | The Peer has produced something (or needs a choice) that **only the customer can resolve** to continue. |
| **When** | Review queue items, approval required, choose variant, confirm publish intent, required clarification on deliverable. |
| **One-line example** | “I’ve prepared the campaign strategy and I’m waiting for your decision.” |
| **Visual** | Warning-adjacent accent (amber/`--pg-color-warning`), not red. Subtle pulse optional on avatar ring. |
| **Progress** | No fake progress bar. Optional “1 of 3 waiting” in **Waiting for me** list only. |
| **User action** | **Yes** — primary CTA (Review, Approve, Choose). |
| **Transitions in** | Working → deliverable ready; Preparing → setup needs customer sign-off. |
| **Transitions out** | Customer decides → Working or Preparing; reject/changes → Working (revision narrative). |
| **Internal maps (examples)** | `awaiting_review`, `inReviewQueue`, approval policy gate, decision pending |

---

### 3.2 Blocked

| Field | Spec |
|-------|------|
| **EN label** | Blocked |
| **NL label** | Geblokkeerd |
| **Meaning** | The Peer **cannot** continue until an **external condition** is fixed — often not a document approval. |
| **When** | Missing integration, expired OAuth, missing required setup field, budget cap, policy conflict, ambiguous scope without deliverable yet. |
| **One-line example** | “I can’t post to LinkedIn until you connect your account.” |
| **Visual** | Neutral border + clear icon; use error color only if time-sensitive or data loss risk. |
| **Progress** | None. Show **what’s missing** in one sentence. |
| **User action** | **Usually yes** — Connect, Complete setup, Contact support (last resort). |
| **Transitions in** | Working/Preparing hits integration or policy wall. |
| **Transitions out** | Customer fixes → Preparing or Working. |
| **Internal maps** | Continuation blocked (non-review), connector auth, onboarding incomplete, hard validation |

** vs Waiting for you:** Blocked = **enabling condition**; Waiting for you = **judgment on work product**.

---

### 3.3 Working

| Field | Spec |
|-------|------|
| **EN label** | Working |
| **NL label** | Bezig |
| **Meaning** | Verified active work toward an outcome the customer would recognize. |
| **When** | Generation/execution in progress, applying customer feedback (revision), continuation running with active unit. |
| **One-line example** | “I’m writing the creative direction for your launch campaign.” |
| **Visual** | Info/live accent (`--pg-color-info` / live dot on avatar). No spinner farms. |
| **Progress** | Optional **indeterminate** subtle indicator only; no % unless tied to real prep counts in disclosure. |
| **User action** | **No** (default). |
| **Transitions in** | Preparing → execution started; Waiting for you → customer requested changes. |
| **Transitions out** | → Waiting for you (ready), Caught up (slice done), Blocked, Failed safely. |
| **Internal maps** | `in_progress`, `continuationRunning`, revision job, executor active |

**Reviewing (merged):** Same pill **Working**; narrative differentiates: “I’m revising the email based on your notes.”

---

### 3.4 Preparing

| Field | Spec |
|-------|------|
| **EN label** | Preparing |
| **NL label** | Voorbereiden |
| **Meaning** | Ramp-up: setup, planning internally, or queued start — **not yet** producing customer-visible deliverable. |
| **When** | Campaign setup incomplete, before first execution, warming context, scheduled start in future. |
| **One-line example** | “I’m getting ready to start your campaign once setup is complete.” |
| **Visual** | Muted accent; calm, slower motion if any. |
| **Progress** | Rare; only if tied to real setup steps customer already knows (e.g. “2 of 4 setup steps”). |
| **User action** | Sometimes — if setup is the gate (then CTA: Continue setup). |
| **Transitions in** | New engagement, post-login, customer completed partial setup. |
| **Transitions out** | → Working, Blocked, Waiting for you (setup approval). |
| **Internal maps** | Onboarding incomplete, plan phase, idle orchestrator before start |

---

### 3.5 Caught up

| Field | Spec |
|-------|------|
| **EN label** | Caught up |
| **NL label** | Alles bij |
| **Meaning** | No customer action needed; Peer is between tasks or finished all work ready for this period. |
| **When** | No queue, no active job, policy allows idle, post-completion until next trigger. |
| **One-line example** | “I don’t need anything from you right now.” |
| **Visual** | Success-muted or neutral; **no** live pulse. |
| **Progress** | None. |
| **User action** | **No**. |
| **Transitions in** | Working → slice complete; Waiting for you → empty queue + idle. |
| **Transitions out** | Scheduled/triggered → Preparing or Working. |
| **Internal maps** | All trackable prepared, no continuation, no queue |

**Idle:** Do not show “Idle” to customers — use **Caught up**.

---

### 3.6 Failed safely

| Field | Spec |
|-------|------|
| **EN label** | Needs help |
| **NL label** | Hulp nodig |
| **Meaning** | Something failed; **no silent breakage**; work is **not** lost; Peer waits for human direction. |
| **When** | Retry exhausted, unrecoverable generation error, integration hard failure after retries. |
| **One-line example** | “I couldn’t finish the LinkedIn post after several tries. I’m paused until you take a look.” |
| **Visual** | Error token sparingly; always pair with calm explanation + one CTA. |
| **Progress** | None. |
| **User action** | **Yes** — View details, Retry, or Get help (never stack trace in customer UI). |
| **Transitions in** | Working → safe failure handler. |
| **Transitions out** | Retry → Working; customer dismiss/abandon → Blocked or Caught up per policy. |
| **Internal maps** | Executor error, continuation failure (customer-presentable) |

**Safe-failure behavior:** Stop autonomous retries that burn trust; preserve artifacts; log admin-side; never claim success.

---

## 4. Priority when multiple internal signals exist

Apply **first match wins** (highest priority at top):

1. **Failed safely** (Needs help)  
2. **Waiting for you** (any decision-required item)  
3. **Blocked** (non-review gate)  
4. **Working** (verified active job)  
5. **Preparing** (ramp/setup/scheduling)  
6. **Caught up**  

**Engagement-level** presence may differ from **Peer-level** only in narrative detail; **Peer pill** uses Peer-level priority across all engagements.

---

## 5. Surface consistency

| Surface | Usage |
|---------|--------|
| **HQ team pulse** | One state per Peer + one narrative line |
| **Command Center — Working now** | Peers in Working or Preparing (with line) |
| **Command Center — Needs your attention** | Peers/items in Waiting for you (+ Blocked if actionable) |
| **Peer header (Working on)** | Primary pill + first-person narrative |
| **Notifications** | See [Interaction Principles](./PEERGENT_INTERACTION_PRINCIPLES.md) — Decision required only by default |
| **Done / activity** | Past tense outcomes; **not** presence pills |
| **Mobile** | Same labels; shorter narrative |

Future Peers (Sales, Support, etc.) use **identical six states**; only narrative nouns change (deal, case, report).

---

## 6. HQ / Command Center naming (aggregate)

| UI section (EN) | Includes presence |
|-----------------|-----------------|
| Needs your attention | Waiting for you (+ Blocked items needing action) |
| Working now | Working + Preparing (with plain language) |
| Recently completed | (no pill — outcomes) |

Do not show seven different pills on HQ.

---

## 7. Admin mapping (not customer-visible)

Presenters map internal truth → single customer state. Examples:

| Internal (admin) | Customer state |
|------------------|----------------|
| `workUnit.status = in_progress` | Working |
| `reviewQueue.length > 0` | Waiting for you |
| `continuationRunning` + active unit | Working |
| `continuation blocked` (review policy) | Waiting for you or Blocked |
| `onboardingComplete = false` | Preparing |
| OAuth missing for planned publish | Blocked |
| Executor error (presentable) | Needs help |

Full diagnostics remain in **Admin Inspector** only.

---

## 8. Related documents

- [Colleague Language](./PEERGENT_COLLEAGUE_LANGUAGE.md) — copy for each state  
- [Interaction Principles](./PEERGENT_INTERACTION_PRINCIPLES.md) — notifications & empty states  
- [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md) — six workspace questions  
