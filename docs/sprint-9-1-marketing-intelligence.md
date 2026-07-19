# Marketing Intelligence (Sprint 9.1)

Peer-specific intelligence foundation for the Marketing Peer.

## Purpose

Produces a structured **Marketing Understanding** object that summarizes everything the Marketing Peer needs to know before creating strategies or content.

This sprint focuses on **understanding**, not execution. No publishing, tools, or content generation.

## Architecture placement

```
Company DNA ────────────────┐
Business Brain ───────────┼──► Marketing Intelligence adapter ──► Marketing Understanding
Marketing Profile domain ─┘              │
                                         ▼
                              Context Engine (marketing-understanding layer)
                                         │
                                         ▼
                              Prompt Builder (Marketing strategy only)
```

The execution pipeline (`buildContext()` → `buildPrompt()` → `execute()`) is unchanged. Marketing Understanding plugs in as a new context layer and slice.

## Domain (`lib/marketing-intelligence/`)

| Entity | Description |
|--------|-------------|
| `MarketingProfile` | Org-scoped root with brand positioning |
| `MarketingGoal` | Active/planned marketing objectives |
| `MarketingContentItem` | Registry of existing content (metadata only) |

Tables: `marketing_profiles`, `marketing_goals`, `marketing_content_items`

## Marketing Understanding dimensions

Completeness is scored across eight dimensions:

- Company DNA (mission, values, tone)
- Brand positioning (positioning statement, value prop, key messages)
- Products
- Services
- Customer segments
- Competitors
- Marketing goals
- Existing content

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/marketing-intelligence` | GET, PATCH | Profile + brand positioning |
| `/api/marketing-intelligence/understanding` | GET | Composed Marketing Understanding |
| `/api/marketing-intelligence/goals` | GET, POST | List/create goals |
| `/api/marketing-intelligence/goals/[id]` | PATCH, DELETE | Update/delete goal |
| `/api/marketing-intelligence/content` | GET, POST | List/create content items |
| `/api/marketing-intelligence/content/[id]` | PATCH, DELETE | Update/delete content item |

## Context integration

- Loader: `lib/context-engine/loaders/marketing-understanding-loader.ts`
- Adapter: `lib/intelligence/adapters/marketing-understanding-adapter.ts`
- Role-gated: only assembles for `Marketing` peers
- Prompt section: `Marketing Understanding` in `marketingPromptStrategy`

## Future capabilities

Content strategy, content creation, campaign planning, and optimization will build on this layer without changing the execution pipeline.

See also: [Sprint 9.2 — Marketing Strategist](./sprint-9-2-marketing-strategist.md)
