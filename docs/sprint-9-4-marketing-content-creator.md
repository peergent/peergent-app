# Sprint 9.4 — Marketing Content Creator

Peer-specific content creation capability that generates one draft at a time from an approved Marketing Plan activity.

## Purpose

Produces a structured **Marketing Content Draft** for a selected content-calendar activity. This sprint focuses on **draft creation** — not publishing, external tools, or performance optimization.

## Architecture placement

```
Marketing Plan (9.3) + selected content-calendar activity
        │
        ▼
buildContext() → buildPrompt({ outputFormat: "marketing-content-draft", marketingPlan, planActivityReference }) → execute() → parseMarketingContentDraft()
        │
        ▼
MarketingContentDraft (single draft, status: draft)
```

The platform execution pipeline is unchanged. Content creation consumes the plan — it does not create a new strategy or plan.

## Supported content types

| Type | Aliases |
|------|---------|
| `linkedin_post` | linkedin |
| `blog_article` | blog_post, blog |
| `newsletter` | email |
| `website_article` | website |
| `social_media_post` | social_post, social |
| `google_ads_copy` | google_ads |
| `meta_ads_copy` | meta_ads, facebook_ads |

## Marketing Content Draft fields

| Field | Description |
|-------|-------------|
| `id` | Unique draft identifier |
| `planActivityReference` | Exact content-calendar activity title |
| `contentType` | Normalized supported type |
| `channel` | Target channel from plan |
| `objective` | Draft objective per plan |
| `targetAudience` | Intended audience |
| `title` | Headline or title |
| `body` | Draft content (never published automatically) |
| `callToAction` | Optional CTA |
| `keywords` | SEO/ads keywords |
| `rationale` | Why + plan reference + preserved strategy links |
| `sourceReferences` | Traceability to context sources |
| `confidence` | low / moderate / high |
| `status` | Always `draft` on generation |
| `warnings` | Missing context or ungrounded claim warnings |

## Traceability chain

```
Marketing Strategy → Marketing Plan → Content Draft
```

- `rationale.strategyLinks` preserved from plan activity
- `sourceReferences` cite company-dna, business-brain, marketing-understanding, marketing-plan, marketing-strategy

## Key modules

| Module | Path |
|--------|------|
| Draft types | `lib/marketing-intelligence/types/content-draft.ts` |
| Plan activity resolver | `lib/marketing-intelligence/content/resolve-plan-activity.ts` |
| Readiness assessment | `lib/marketing-intelligence/content/assess-content-readiness.ts` |
| Task prompt appendix | `lib/marketing-intelligence/content/build-content-task-prompt.ts` |
| Parser + validator | `lib/marketing-intelligence/content/parse-marketing-content-draft.ts` |
| Orchestrator | `lib/marketing-intelligence/content/generate-marketing-content-draft.ts` |

## API

`POST /api/marketing-intelligence/content-draft`

```json
{
  "peerId": "uuid",
  "plan": { "...MarketingPlan..." },
  "planActivityReference": "Founder pain points slot",
  "taskHint": "Optional focus",
  "options": { "temperature": 0.45 }
}
```

Requires a **Marketing** peer, an approved **MarketingPlan**, and an explicit **planActivityReference**.

Returns `{ draft, traceId, warnings }`.

## Guardrails

- One draft per request
- Status always `draft` — never auto-published
- No new strategy or plan generation
- Company DNA tone compliance required
- Business Brain grounding for factual claims
- Ungrounded claim detection for unknown product/service references
- Unsupported content types rejected before generation

## Capability chain

```
Marketing Understanding (9.1) → Marketing Strategy (9.2) → Marketing Plan (9.3) → Content Draft (9.4) → Publishing / Performance Review (future)
```

See also: [Sprint 9.3 — Marketing Planner](./sprint-9-3-marketing-planner.md) · [Sprint 9.5 — Marketing Workspace](./sprint-9-5-marketing-workspace.md)
