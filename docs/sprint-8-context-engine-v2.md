# Sprint 8 — Context Engine v2 Implementation

Implementation of the approved Context Engine v2 architecture.

## Public entry points

| Component | Method | Path |
|-----------|--------|------|
| Context Engine | `buildContext()` | `lib/context-engine/core/engine.ts` |
| Prompt Builder | `buildPrompt()` | `lib/prompt-builder/prompt-builder.ts` |
| AI Runtime | `execute()` | `lib/ai-runtime/ai-runtime.ts` |

## Intelligence layer

- `lib/intelligence/adapters/company-dna-adapter.ts` — loads Company DNA via domain service
- `lib/intelligence/adapters/business-brain-query-service.ts` — plans and executes selective Business Brain queries
- `lib/intelligence/retrieval/query-planner.ts` — rule-based retrieval planning
- `lib/intelligence/retrieval/fact-ranker.ts` — fact ranking and list trimming

## Context layers (v2)

Replaced legacy `brain` layer (website intelligence) with:

- `company-dna` — full Company DNA record
- `business-brain` — selective domain query

Website intelligence remains available for the Website Intelligence UI via `assessmentToBrainSnapshot()` but is no longer used by the Context Engine.

## Server AI route

`POST /api/ai/execute`

```json
{
  "peerId": "uuid",
  "message": "User message used as task hint",
  "options": { "model": "...", "temperature": 0.4 }
}
```

Requires authenticated org session. Runs: Scope → buildContext → buildPrompt → execute.

## Provider registry

`lib/ai-runtime/provider-registry.ts` — OpenAI registered by default; Anthropic placeholder for future configuration.

## Tests

- `lib/prompt-builder/__tests__/prompt-builder.test.ts`
- `lib/intelligence/__tests__/retrieval.test.ts`
- `lib/ai-runtime/__tests__/ai-runtime.test.ts`
