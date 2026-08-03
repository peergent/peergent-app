# Context Projection

The runtime never sends the entire BrainSnapshot to providers automatically.

## Projection

`projectBrainContext()` selects slices based on capability `requiredContext` and `optionalContext` from the registry.

Examples:

**company_understanding**
- organization, business (+ optional campaign)
- knownFacts, unknowns

**website_understanding**
- website (+ optional business, brand)
- unknowns

## Output

```typescript
{
  snapshot: BrainSnapshot;      // projected refs only
  companySnapshot: CompanySnapshot;
  projection: {
    contextHash: string;
    includedSlices: string[];
    excludedSlices: string[];
    estimatedTokens: number;
  };
}
```

## Cache key

Cache keys include:
- organization
- capability
- context hash
- payload hash
- provider id
- capability version
- freshness

No cross-tenant cache. Keys are org-scoped via `buildCacheKey()`.

See `lib/brain/runtime/context-projection.ts`.
