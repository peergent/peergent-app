# Peergent Colleague Language

**Status:** Product copy guide (Sprint 29A.1)  
**Authority:** Subordinate to [Experience Constitution](../PEERGENT_EXPERIENCE_CONSTITUTION.md) and [Colleague Experience Architecture](./PEERGENT_COLLEAGUE_EXPERIENCE_ARCHITECTURE.md).  
**Scope:** All customer-facing strings (EN + NL). Admin/technical copy is separate.

---

## 1. Core principle

Peergent speaks like a **capable colleague**, not like software.

The Peer is a **character with professional warmth** — not a chatbot, not a system status line, not a billboard.

---

## 2. Voice & tone

| Attribute | Guideline |
|-----------|-----------|
| **Voice** | Calm, direct, competent, respectful of time |
| **Tone** | Warm but not casual; confident without hype |
| **Sentence length** | One idea per sentence; 8–18 words for status; max ~25 for explanations |
| **Tense** | Present for now (“I’m working on…”); past for Done (“I completed…”); future only when scheduled with date |
| **First person** | Peer speaks as **I** in narratives; **we** only for Peergent the company in legal/settings |
| **Peer names** | Use given name (e.g. Emma) in HQ/CC; “Marketing Peer” acceptable in settings/legal |
| **Confidence** | State what is true; use “I’ll” when commitment is real |
| **Uncertainty** | Name the gap: “I’m not fully certain because …” + what customer can do |
| **Errors** | One apology max; what happened in human terms; what is preserved; one next step |
| **Approval** | Frame as judgment on **work**, not system events |
| **Completion** | Outcome-first: what was delivered, not that runtime finished |
| **Performance** | Business outcomes, not model metrics |
| **Empty states** | Reassurance, not marketing |
| **Notifications** | Short; decision-led when action required |

---

## 3. Patterns (EN / NL)

| Pattern (EN) | Example EN | Example NL |
|--------------|------------|------------|
| I am working on… | I’m working on the email for your launch campaign. | Ik werk aan de e-mail voor je lanceringcampagne. |
| I need your decision on… | I need your decision on the campaign strategy. | Ik heb jouw beslissing nodig over de campagnestrategie. |
| I completed… | I completed the competitor research. | Ik heb het concurrentieonderzoek afgerond. |
| I could not finish because… | I couldn’t finish the post because LinkedIn isn’t connected. | Ik kon het bericht niet afronden omdat LinkedIn niet is gekoppeld. |
| I don’t need anything from you. | I don’t need anything from you right now. | Ik hoef nu niets van je. |
| Here is what changed. | Here’s what changed in version 2. | Dit is er gewijzigd in versie 2. |
| Here is what I recommend. | I recommend approving the strategy before we write the posts. | Ik raad aan de strategie goed te keuren voordat we de posts schrijven. |
| I’m not fully certain because… | I’m not fully certain about the audience size because we have limited data. | Ik ben niet helemaal zeker over de omvang van de doelgroep door beperkte data. |

---

## 4. Forbidden software language → colleague rewrite

| Avoid (EN) | Write instead (EN) | NL example |
|--------------|-------------------|------------|
| Runtime completed | I finished the next step for your campaign. | Ik heb de volgende stap voor je campagne afgerond. |
| Work unit created | I started preparing your LinkedIn content. | Ik ben begonnen met je LinkedIn-content. |
| Execution failed | I couldn’t complete this. Here’s what you can do. | Ik kon dit niet afronden. Dit kun je doen. |
| Artifact generated | I prepared the campaign strategy for you. | Ik heb de campagnestrategie voor je klaargezet. |
| Planner queued task | I’ll work on the creative direction next. | Ik ga als volgende aan de creatieve richting werken. |
| Review queue | Waiting for you | Wacht op jou |
| Processing request | I’m working on it. | Ik ben ermee bezig. |
| Object not found | This item isn’t available yet. | Dit onderdeel is nog niet beschikbaar. |
| Campaign status: planning | I’m preparing your campaign. | Ik bereid je campagne voor. |
| Deliverable | Strategy / email / post (use the thing’s name) | Strategie / e-mail / post |
| Idempotency / continuation | (admin only) | (admin only) |

---

## 5. Prohibited habits

- Excessive exclamation marks  
- Fake enthusiasm (“Amazing news!!!”)  
- Robotic reassurance (“Your request is being processed”)  
- Badge spam (multiple statuses on one card)  
- Apologizing repeatedly for the same issue  
- Technical detail in default path (HTTP codes, internal IDs)  
- Paragraph-length status on mobile  
- Vague status (“In progress”, “Pending”) without **what**  
- Claiming success before validation/approval  
- Blaming the user  

---

## 6. Domain examples (Peer-specific)

### Marketing Peer

| Situation | EN | NL |
|-----------|----|----|
| Strategy ready | I’ve prepared your campaign strategy. | Ik heb je campagnestrategie klaargezet. |
| Revision | I’m revising the email based on your feedback. | Ik herzie de e-mail op basis van je feedback. |
| Publish later | Publishing isn’t available yet; I’ll queue it when you approve. | Publiceren is nog niet beschikbaar; ik plan het zodra je goedkeurt. |

### Sales Peer (future)

| Situation | EN | NL |
|-----------|----|----|
| Outreach draft | I drafted a follow-up for your deal with Acme. | Ik heb een follow-up voor je deal met Acme geschreven. |
| CRM blocked | I can’t update the deal until Salesforce is connected. | Ik kan de deal niet bijwerken tot Salesforce is gekoppeld. |

### Support Peer (future)

| Situation | EN | NL |
|-----------|----|----|
| Reply ready | I drafted a reply to the customer’s question. | Ik heb een antwoord op de vraag van de klant geschreven. |
| Escalation | I need your decision on this refund request. | Ik heb jouw beslissing nodig over deze terugbetaling. |

### Planner Peer (future)

| Situation | EN | NL |
|-----------|----|----|
| Schedule | I scheduled your team posts for next week. | Ik heb je teamposts voor volgende week ingepland. |
| Conflict | Two campaigns overlap on Tuesday — I need you to pick one. | Twee campagnes overlappen op dinsdag — kies er één. |

### Finance Peer (future)

| Situation | EN | NL |
|-----------|----|----|
| Report | I completed the monthly marketing spend summary. | Ik heb het maandelijkse marketingoverzicht afgerond. |
| Cap | I paused the campaign because it reached the budget limit. | Ik heb de campagne gepauzeerd omdat het budgetlimiet is bereikt. |

---

## 7. Section copy alignment (six questions)

| Section (EN) | Lead copy tone |
|--------------|----------------|
| Working on | First-person now |
| Waiting for me | Second-person decision (“your review”) |
| Done | Past tense outcomes |
| Work | Neutral list titles; Peer name in subtitle optional |
| Results | Outcomes for the business |
| Settings | Instructional, second person |

---

## 8. Localization

- NL must be **natural**, not literal (see NL column examples).  
- Interpolation must support plurals (1 item / 3 items).  
- Same keys for HQ, CC, Peer — no forked copy trees per surface.  

---

## 9. Related documents

- [Presence Model](./PEERGENT_PRESENCE_MODEL.md) — state labels EN/NL  
- [Interaction Principles](./PEERGENT_INTERACTION_PRINCIPLES.md) — notifications & empty states  
