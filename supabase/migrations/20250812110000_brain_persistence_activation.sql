-- PX-48.1: Production persistence activation — execution idempotency states + versioned episode upsert.

ALTER TABLE public.brain_execution_idempotency
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'succeeded',
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.brain_execution_idempotency
  DROP CONSTRAINT IF EXISTS brain_execution_idempotency_status_check;

ALTER TABLE public.brain_execution_idempotency
  ADD CONSTRAINT brain_execution_idempotency_status_check CHECK (
    status IN ('reserved', 'executing', 'succeeded', 'failed', 'ambiguous')
  );

CREATE INDEX IF NOT EXISTS brain_execution_idempotency_status_idx
  ON public.brain_execution_idempotency (organization_id, status);

CREATE TRIGGER brain_execution_idempotency_set_updated_at
  BEFORE UPDATE ON public.brain_execution_idempotency
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Versioned episode upsert with optimistic concurrency.
CREATE OR REPLACE FUNCTION public.upsert_brain_project_episode_versioned(
  p_organization_id uuid,
  p_project_id text,
  p_expected_version integer,
  p_episode jsonb,
  p_artifacts jsonb,
  p_resolved_graphs jsonb,
  p_cached_learning_proposals jsonb,
  p_episode_id text,
  p_peer_id text,
  p_correlation_id text,
  p_episode_status text,
  p_current_state text,
  p_current_brain text,
  p_started_at timestamptz,
  p_updated_at timestamptz,
  p_completed_at timestamptz,
  p_last_error text
)
RETURNS TABLE (new_version integer, conflict boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version integer;
BEGIN
  SELECT version INTO v_current_version
  FROM public.brain_project_episodes
  WHERE organization_id = p_organization_id
    AND project_id = p_project_id
  FOR UPDATE;

  IF v_current_version IS NOT NULL AND v_current_version <> p_expected_version THEN
    RETURN QUERY SELECT v_current_version, true;
    RETURN;
  END IF;

  INSERT INTO public.brain_project_episodes (
    organization_id,
    project_id,
    episode_id,
    peer_id,
    correlation_id,
    episode_status,
    current_state,
    current_brain,
    version,
    episode,
    artifacts,
    resolved_graphs,
    cached_learning_proposals,
    started_at,
    updated_at,
    completed_at,
    last_error
  ) VALUES (
    p_organization_id,
    p_project_id,
    p_episode_id,
    p_peer_id,
    p_correlation_id,
    p_episode_status,
    p_current_state,
    p_current_brain,
    COALESCE(p_expected_version, 0) + 1,
    p_episode,
    p_artifacts,
    p_resolved_graphs,
    p_cached_learning_proposals,
    p_started_at,
    p_updated_at,
    p_completed_at,
    p_last_error
  )
  ON CONFLICT (organization_id, project_id) DO UPDATE SET
    episode_id = EXCLUDED.episode_id,
    peer_id = EXCLUDED.peer_id,
    correlation_id = EXCLUDED.correlation_id,
    episode_status = EXCLUDED.episode_status,
    current_state = EXCLUDED.current_state,
    current_brain = EXCLUDED.current_brain,
    version = public.brain_project_episodes.version + 1,
    episode = EXCLUDED.episode,
    artifacts = EXCLUDED.artifacts,
    resolved_graphs = EXCLUDED.resolved_graphs,
    cached_learning_proposals = EXCLUDED.cached_learning_proposals,
    updated_at = EXCLUDED.updated_at,
    completed_at = EXCLUDED.completed_at,
    last_error = EXCLUDED.last_error
  WHERE public.brain_project_episodes.version = p_expected_version;

  IF NOT FOUND AND v_current_version IS NOT NULL THEN
    RETURN QUERY SELECT v_current_version, true;
    RETURN;
  END IF;

  SELECT version INTO v_current_version
  FROM public.brain_project_episodes
  WHERE organization_id = p_organization_id
    AND project_id = p_project_id;

  RETURN QUERY SELECT v_current_version, false;
END;
$$;
