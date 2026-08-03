-- Sprint 6: Project Brain persistence — org-scoped runtime, snapshots, corrections, invalidation.
-- Additive only. RLS via is_org_member on all customer-facing tables.

-- ---------------------------------------------------------------------------
-- Brain runs
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

-- ---------------------------------------------------------------------------
-- Brain outputs (immutable capability payloads)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Brain audit events (append-only)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Versioned snapshots (metadata + bounded payload refs)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  snapshot_kind text NOT NULL,
  schema_version text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  context_hash text NOT NULL,
  source_hash text,
  readiness_state text,
  freshness text NOT NULL DEFAULT 'unknown',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_ref_id text,
  superseded_by uuid REFERENCES public.brain_snapshots (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_snapshots_kind_check CHECK (
    snapshot_kind IN ('company', 'website', 'brain')
  )
);

CREATE INDEX IF NOT EXISTS brain_snapshots_organization_id_idx
  ON public.brain_snapshots (organization_id, snapshot_kind, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS brain_snapshots_org_kind_version_idx
  ON public.brain_snapshots (organization_id, snapshot_kind, version_number);

CREATE TABLE IF NOT EXISTS public.brain_snapshot_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.brain_snapshots (id) ON DELETE CASCADE,
  source_kind text NOT NULL,
  ref_id text NOT NULL,
  label text,
  captured_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_snapshot_sources_snapshot_id_idx
  ON public.brain_snapshot_sources (snapshot_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions (after table creation)
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

CREATE OR REPLACE FUNCTION public.brain_snapshot_org_id(target_snapshot_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.brain_snapshots WHERE id = target_snapshot_id LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Customer corrections
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_customer_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'organization',
  field_key text NOT NULL,
  action text NOT NULL,
  previous_value_ref text,
  corrected_value text,
  corrected_list_value jsonb,
  reason text,
  status text NOT NULL DEFAULT 'active',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  invalidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  reversibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  superseded_by uuid REFERENCES public.brain_customer_corrections (id) ON DELETE SET NULL,
  actor_id uuid,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_customer_corrections_organization_id_idx
  ON public.brain_customer_corrections (organization_id, field_key, status);

-- ---------------------------------------------------------------------------
-- Memory candidates
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_memory_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  peer_id text,
  campaign_id text,
  user_id uuid,
  scope text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  confidence text NOT NULL,
  review_state text NOT NULL DEFAULT 'candidate',
  sensitivity text,
  provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text,
  contradiction_ref text,
  source_run_id uuid REFERENCES public.brain_runs (id) ON DELETE SET NULL,
  source_output_id uuid REFERENCES public.brain_outputs (id) ON DELETE SET NULL,
  expires_at timestamptz,
  review_actor_id uuid,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_memory_candidates_organization_id_idx
  ON public.brain_memory_candidates (organization_id, review_state, created_at DESC);

-- ---------------------------------------------------------------------------
-- Idempotency keys
-- ---------------------------------------------------------------------------

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
-- Dependency / invalidation state
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_dependency_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  entity_kind text NOT NULL,
  entity_ref text NOT NULL,
  capability_id text,
  output_id uuid REFERENCES public.brain_outputs (id) ON DELETE SET NULL,
  freshness text NOT NULL DEFAULT 'fresh',
  stale_reason text,
  invalidated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, entity_kind, entity_ref, capability_id)
);

CREATE INDEX IF NOT EXISTS brain_dependency_states_organization_id_idx
  ON public.brain_dependency_states (organization_id, freshness);

CREATE TABLE IF NOT EXISTS public.brain_invalidation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  source_event text NOT NULL,
  affected_entity text NOT NULL,
  affected_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text NOT NULL,
  correlation_id text,
  attempts integer NOT NULL DEFAULT 0,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS brain_invalidation_queue_organization_id_idx
  ON public.brain_invalidation_queue (organization_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Cache metadata
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_cache_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  capability_id text NOT NULL,
  capability_version text NOT NULL,
  context_hash text NOT NULL,
  payload_hash text NOT NULL,
  provider_class text NOT NULL,
  freshness text NOT NULL DEFAULT 'fresh',
  output_id uuid REFERENCES public.brain_outputs (id) ON DELETE SET NULL,
  hit_count integer NOT NULL DEFAULT 0,
  invalidated_at timestamptz,
  invalidated_reason text,
  expires_at timestamptz,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, cache_key)
);

CREATE INDEX IF NOT EXISTS brain_cache_entries_organization_id_idx
  ON public.brain_cache_entries (organization_id, capability_id);

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  proposal_id text NOT NULL,
  run_id uuid REFERENCES public.brain_runs (id) ON DELETE SET NULL,
  output_id uuid REFERENCES public.brain_outputs (id) ON DELETE SET NULL,
  campaign_id text,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approver_id uuid,
  feedback text,
  policy_version text,
  consequence text,
  reversibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brain_approvals_organization_id_idx
  ON public.brain_approvals (organization_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER brain_runs_set_updated_at
  BEFORE UPDATE ON public.brain_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brain_customer_corrections_set_updated_at
  BEFORE UPDATE ON public.brain_customer_corrections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brain_memory_candidates_set_updated_at
  BEFORE UPDATE ON public.brain_memory_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brain_invalidation_queue_set_updated_at
  BEFORE UPDATE ON public.brain_invalidation_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brain_approvals_set_updated_at
  BEFORE UPDATE ON public.brain_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER brain_dependency_states_set_updated_at
  BEFORE UPDATE ON public.brain_dependency_states
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.brain_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_snapshot_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_customer_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_memory_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_dependency_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_invalidation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brain runs readable by organization members"
  ON public.brain_runs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain runs insertable by organization members"
  ON public.brain_runs FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain runs updatable by organization members"
  ON public.brain_runs FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain outputs readable by organization members"
  ON public.brain_outputs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain outputs insertable by organization members"
  ON public.brain_outputs FOR INSERT
  WITH CHECK (public.is_org_member(public.brain_run_org_id(run_id)));

CREATE POLICY "Brain audit events readable by organization members"
  ON public.brain_audit_events FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain audit events insertable by organization members"
  ON public.brain_audit_events FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain snapshots readable by organization members"
  ON public.brain_snapshots FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain snapshots insertable by organization members"
  ON public.brain_snapshots FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain snapshot sources readable by organization members"
  ON public.brain_snapshot_sources FOR SELECT
  USING (public.is_org_member(public.brain_snapshot_org_id(snapshot_id)));

CREATE POLICY "Brain snapshot sources insertable by organization members"
  ON public.brain_snapshot_sources FOR INSERT
  WITH CHECK (public.is_org_member(public.brain_snapshot_org_id(snapshot_id)));

CREATE POLICY "Brain corrections readable by organization members"
  ON public.brain_customer_corrections FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain corrections insertable by organization members"
  ON public.brain_customer_corrections FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain corrections updatable by organization members"
  ON public.brain_customer_corrections FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain memory candidates readable by organization members"
  ON public.brain_memory_candidates FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain memory candidates insertable by organization members"
  ON public.brain_memory_candidates FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain memory candidates updatable by organization members"
  ON public.brain_memory_candidates FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain idempotency keys readable by organization members"
  ON public.brain_idempotency_keys FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain idempotency keys insertable by organization members"
  ON public.brain_idempotency_keys FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain dependency states readable by organization members"
  ON public.brain_dependency_states FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain dependency states insertable by organization members"
  ON public.brain_dependency_states FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain dependency states updatable by organization members"
  ON public.brain_dependency_states FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain invalidation queue readable by organization members"
  ON public.brain_invalidation_queue FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain invalidation queue insertable by organization members"
  ON public.brain_invalidation_queue FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain invalidation queue updatable by organization members"
  ON public.brain_invalidation_queue FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain cache entries readable by organization members"
  ON public.brain_cache_entries FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain cache entries insertable by organization members"
  ON public.brain_cache_entries FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain cache entries updatable by organization members"
  ON public.brain_cache_entries FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain approvals readable by organization members"
  ON public.brain_approvals FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Brain approvals insertable by organization members"
  ON public.brain_approvals FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Brain approvals updatable by organization members"
  ON public.brain_approvals FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
