# Capability Dependencies

Canonical typed graph in `lib/brain/capabilities/capability-dependencies.ts`.

```
company_understanding
├── brand_understanding
├── website_understanding (parallel)
└── competitor_understanding

strategy
├── company_understanding
├── brand_understanding
├── website_understanding
└── competitor_understanding (optional)

channel_planning
└── strategy

creative_generation (deliverable planning)
├── strategy
├── channel_planning
└── brand_understanding

performance_interpretation
└── (performance context — no hard deps)

optimization
├── strategy
├── channel_planning
├── creative_generation
└── performance_interpretation (optional when insufficient data)
```

## Uses

- Dependency order for workflow orchestration (`resolveCapabilityExecutionOrder`)
- Readiness and admin inspection (`CapabilityInspectionReadModel`)
- Stale dependency detection when upstream capability version changes
- Future parent/child run planning

## Validation

`validateCapabilityDependencyGraphAcyclic()` — must remain acyclic.

Invalidation cascade remains separate in `lib/brain/invalidation/dependency-graph.ts`.
