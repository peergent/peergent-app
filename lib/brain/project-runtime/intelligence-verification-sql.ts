/**
 * PX-63D — production SQL verification for intelligence graph persistence.
 * Run against Supabase SQL editor with :project_id bound.
 */

export const PX63D_INTELLIGENCE_VERIFICATION_SQL = `
-- PX-63D: prove reasoning / MI / strategy durable persistence for one project
WITH project AS (
  SELECT :project_id::text AS project_id
),
layer_docs AS (
  SELECT
    d.brain_id,
    d.document_kind,
    d.project_id,
    d.organization_id,
    d.output_ref AS graph_ref,
    d.created_at,
    d.payload->'graph'->'providerMeta'->>'providerMode' AS provider_mode,
    d.payload->'graph'->'providerMeta'->>'providerId' AS provider_id,
    d.payload->'graph'->'providerMeta'->>'modelId' AS model_id,
    COALESCE((d.payload->'graph'->'providerMeta'->>'fallbackUsed')::boolean, false) AS fallback_used,
    CASE
      WHEN d.brain_id = 'research' THEN d.payload->'graph'->'summary'->>'providerId'
      ELSE d.payload->'graph'->'providerMeta'->>'providerId'
    END AS research_or_llm_provider_id
  FROM brain_layer_documents d
  CROSS JOIN project p
  WHERE d.project_id = p.project_id
    AND d.brain_id IN ('reasoning', 'marketing_intelligence', 'strategy', 'research')
),
episode_row AS (
  SELECT
    e.project_id,
    e.episode->'snapshot'->>'state' AS episode_state,
    e.episode->'snapshot'->'completedBrains' AS completed_brains,
    e.episode->>'lastError' AS last_error,
    e.episode->'resolvedGraphs'->'reasoningBrainGraph'->'providerMeta' AS reasoning_provider_meta,
    e.episode->'resolvedGraphs'->'marketingIntelligenceBrainGraph'->'providerMeta' AS mi_provider_meta,
    e.episode->'resolvedGraphs'->'strategyBrainGraph'->'providerMeta' AS strategy_provider_meta
  FROM brain_project_episodes e
  CROSS JOIN project p
  WHERE e.project_id = p.project_id
  ORDER BY e.version DESC
  LIMIT 1
),
audit_events AS (
  SELECT
    ev.metadata->>'brainId' AS brain_id,
    ev.metadata->>'providerMode' AS provider_mode,
    ev.metadata->>'providerId' AS provider_id,
    ev.metadata->>'modelId' AS model_id,
    COALESCE((ev.metadata->>'fallbackUsed')::boolean, false) AS fallback_used,
    ev.metadata->>'graphRef' AS graph_ref,
    ev.created_at
  FROM brain_project_events ev
  CROSS JOIN project p
  WHERE ev.project_id = p.project_id
    AND ev.type = 'intelligence_llm_execution'
)
SELECT
  ld.brain_id,
  ld.document_kind,
  ld.provider_mode,
  ld.provider_id,
  ld.model_id,
  ld.fallback_used,
  ld.graph_ref,
  ld.created_at,
  er.episode_state,
  er.completed_brains,
  er.last_error,
  er.reasoning_provider_meta,
  er.mi_provider_meta,
  er.strategy_provider_meta
FROM layer_docs ld
LEFT JOIN episode_row er ON er.project_id = ld.project_id
UNION ALL
SELECT
  ae.brain_id,
  'audit:intelligence_llm_execution' AS document_kind,
  ae.provider_mode,
  ae.provider_id,
  ae.model_id,
  ae.fallback_used,
  ae.graph_ref,
  ae.created_at,
  NULL, NULL, NULL, NULL, NULL, NULL
FROM audit_events ae
ORDER BY brain_id, created_at DESC;
`.trim();
