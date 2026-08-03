# Token Projections (Sprint 5)

Future LLM providers should receive minimal projected context per capability — not full snapshots.

## Campaign strategy (`strategy`)

Needs: company summary, brand summary, campaign goal/context, website summary, competitor summary (if available).  
Exclude: raw website HTML, full performance history, unrelated campaigns.

## Deliverable planning (`creative_generation`)

Needs: strategy output, channel plan, brand constraints, campaign objective.  
Exclude: entire company profile, raw website pages.

## Performance interpretation

Needs: normalized metrics, comparison windows, campaign/channel metadata.  
Exclude: full event streams.

## Cache / reuse

Persist references to upstream capability outputs (`upstreamOutputs` on run request) so providers do not regenerate upstream decisions.

Implementation: `hashUpstreamOutputVersions()` included in runtime cache key payload.
