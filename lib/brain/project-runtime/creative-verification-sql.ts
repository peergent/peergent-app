/**
 * PX-64 — production SQL verification for Creative LLM handoff.
 */

export const CREATIVE_LLM_VERIFICATION_SQL = `
SELECT
  ev.event_type,
  ev.brain_id,
  ev.metadata,
  ev.recorded_at
FROM brain_project_events ev
WHERE ev.project_id = $1
  AND ev.brain_id = 'creative'
  AND ev.event_type IN (
    'creative_llm_execution',
    'creative_graph_reused',
    'creative_llm_started',
    'creative_llm_completed',
    'creative_llm_failed',
    'creative_validation_failed'
  )
ORDER BY ev.recorded_at ASC;
`;

export const CREATIVE_PROVIDER_META_VERIFICATION_SQL = `
SELECT
  ev.event_type,
  ev.brain_id,
  ev.metadata->>'providerMode' AS provider_mode,
  ev.metadata->>'providerId' AS provider_id,
  ev.metadata->>'modelId' AS model_id,
  ev.metadata->>'fallbackUsed' AS fallback_used,
  ev.metadata->>'inputEvidenceCount' AS input_evidence_count,
  ev.metadata->>'graphReused' AS graph_reused,
  ev.recorded_at
FROM brain_project_events ev
WHERE ev.project_id = $1
  AND ev.brain_id = 'creative'
  AND (
    ev.metadata->>'providerMode' = 'live_llm'
    OR ev.event_type = 'creative_graph_reused'
  )
ORDER BY ev.recorded_at DESC
LIMIT 20;
`;

/** Production project that exhibited template copy before PX-64. */
export const PX64_PRODUCTION_SYMPTOM_PROJECT_ID = "proj-1787251290382-50sfl9b";
