-- PX-50.6: BrainRuntime persistence activation for production server actions.
-- Idempotent when 20250803100000_brain_persistence.sql is already applied.

-- ---------------------------------------------------------------------------
-- Core BrainRuntime tables (execute path)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  peer_id text,
  campaign_id text,
  task_id text,
  environment text NOT NULL DEFAULT 'live',
  capability_id text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  trace_id text NOT NULL,
  parent_run_id uuid REFERENCES public.brain_runs (id) ON DELETE SET NULL,
  correlation_id text,
  policy_decision text,
  readiness_state text,
  context_hash text,
  snapshot_version text,
  output_id uuid,
  error_code text,
  error_message text,
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  budget jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT brain_runs_environment_check CHECK (environment IN ('live', 'demo', 'test'))
);

CREATE INDEX IF NOT EXISTS brain_runs_organization_id_idx
  ON public.brain_runs (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS brain_runs_org_capability_status_idx
  ON public.brain_runs (organization_id, capability_id, status);
CREATE INDEX IF NOT EXISTS brain_runs_trace_id_idx
  ON public.brain_runs (organization_id, trace_id);
CREATE INDEX IF NOT EXISTS brain_runs_parent_run_id_idx
  ON public.brain_runs (organization_id, parent_run_id);

CREATE TABLE IF NOT EXISTS public.brain_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.brain_runs (id) ON DELETE CASCADE,
  capability_id text NOT NULL,
  capability_version text NOT NULL,
  provider_class text NOT NULL DEFAULT 'deterministic',
  output_schema_version text NOT NULL DEFAULT 'BrainStructuredOutput',
  content_hash text NOT NULL,
  context_hash text,
  snapshot_version text,
  freshness text NOT NULL DEFAULT 'fresh',
  superseded_by uuid REFERENCES public.brain_outputs (id) ON DELETE SET NULL,
  output jsonb NOT NULL,
  provenance_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  stored_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_outputs_organization_id_idx
  ON public.brain_outputs (organization_id, stored_at DESC);
CREATE INDEX IF NOT EXISTS brain_outputs_run_id_idx
  ON public.brain_outputs (run_id);
CREATE INDEX IF NOT EXISTS brain_outputs_org_capability_idx
  ON public.brain_outputs (organization_id, capability_id, stored_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS brain_outputs_run_id_unique_idx
  ON public.brain_outputs (run_id);

CREATE TABLE IF NOT EXISTS public.brain_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.brain_runs (id) ON DELETE SET NULL,
  trace_id text NOT NULL,
  peer_id text NOT NULL,
  campaign_id text,
  environment text NOT NULL,
  capability_id text,
  policy_decision text,
  approval_state text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_request_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_tokens integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_audit_events_organization_id_idx
  ON public.brain_audit_events (organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS brain_audit_events_trace_id_idx
  ON public.brain_audit_events (organization_id, trace_id);
CREATE INDEX IF NOT EXISTS brain_audit_events_run_id_idx
  ON public.brain_audit_events (run_id);

CREATE TABLE IF NOT EXISTS public.brain_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  capability_id text NOT NULL,
  idempotency_key text NOT NULL,
  run_id uuid NOT NULL REFERENCES public.brain_runs (id) ON DELETE CASCADE,
  request_hash text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, capability_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS brain_idempotency_keys_organization_id_idx
  ON public.brain_idempotency_keys (organization_id);

-- ---------------------------------------------------------------------------
-- RLS helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.brain_run_org_id(target_run_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.brain_runs WHERE id = target_run_id LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger (brain_runs only — required for run updates)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS brain_runs_set_updated_at ON public.brain_runs;
CREATE TRIGGER brain_runs_set_updated_at
  BEFORE UPDATE ON public.brain_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.brain_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brain runs readable by organization members" ON public.brain_runs;
CREATE POLICY "Brain runs readable by organization members"
  ON public.brain_runs FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain runs insertable by organization members" ON public.brain_runs;
CREATE POLICY "Brain runs insertable by organization members"
  ON public.brain_runs FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain runs updatable by organization members" ON public.brain_runs;
CREATE POLICY "Brain runs updatable by organization members"
  ON public.brain_runs FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain outputs readable by organization members" ON public.brain_outputs;
CREATE POLICY "Brain outputs readable by organization members"
  ON public.brain_outputs FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain outputs insertable by organization members" ON public.brain_outputs;
CREATE POLICY "Brain outputs insertable by organization members"
  ON public.brain_outputs FOR INSERT
  WITH CHECK (public.is_org_member(public.brain_run_org_id(run_id)));

DROP POLICY IF EXISTS "Brain outputs updatable by organization members" ON public.brain_outputs;
CREATE POLICY "Brain outputs updatable by organization members"
  ON public.brain_outputs FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain audit events readable by organization members" ON public.brain_audit_events;
CREATE POLICY "Brain audit events readable by organization members"
  ON public.brain_audit_events FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain audit events insertable by organization members" ON public.brain_audit_events;
CREATE POLICY "Brain audit events insertable by organization members"
  ON public.brain_audit_events FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain idempotency keys readable by organization members" ON public.brain_idempotency_keys;
CREATE POLICY "Brain idempotency keys readable by organization members"
  ON public.brain_idempotency_keys FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain idempotency keys insertable by organization members" ON public.brain_idempotency_keys;
CREATE POLICY "Brain idempotency keys insertable by organization members"
  ON public.brain_idempotency_keys FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain idempotency keys updatable by organization members" ON public.brain_idempotency_keys;
CREATE POLICY "Brain idempotency keys updatable by organization members"
  ON public.brain_idempotency_keys FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Table privileges for authenticated server actions (RLS enforced)
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.brain_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.brain_outputs TO authenticated;
GRANT SELECT, INSERT ON public.brain_audit_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.brain_idempotency_keys TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.brain_runs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.brain_outputs TO service_role;
GRANT SELECT, INSERT ON public.brain_audit_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.brain_idempotency_keys TO service_role;
