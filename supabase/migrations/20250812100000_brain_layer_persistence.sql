-- PX-48: Durable Brain layer + project runtime persistence.
-- Additive only. Org-scoped RLS via is_org_member on all customer-facing tables.

-- ---------------------------------------------------------------------------
-- Brain layer documents — versioned immutable snapshots (JSONB payloads)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_layer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  brain_id text NOT NULL,
  document_kind text NOT NULL,
  document_id text NOT NULL,
  scope_key text NOT NULL DEFAULT 'org',
  project_id text,
  campaign_id text,
  peer_id text,
  output_ref text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text,
  confidence text,
  schema_version text NOT NULL DEFAULT '1',
  payload jsonb NOT NULL,
  supersedes_output_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_layer_documents_kind_check CHECK (
    document_kind IN (
      'company_store',
      'research_record',
      'research_snapshot',
      'research_run',
      'research_history',
      'reasoning_record',
      'reasoning_snapshot',
      'reasoning_run',
      'reasoning_history',
      'mi_record',
      'mi_snapshot',
      'mi_run',
      'mi_history',
      'strategy_snapshot',
      'strategy_run',
      'strategy_history',
      'planning_record',
      'planning_snapshot',
      'planning_run',
      'planning_history',
      'creative_record',
      'validation_record',
      'memory_store',
      'execution_store',
      'learning_snapshot',
      'learning_run',
      'learning_history',
      'brand_record'
    )
  ),
  UNIQUE (organization_id, output_ref),
  UNIQUE (organization_id, brain_id, document_kind, document_id)
);

CREATE INDEX IF NOT EXISTS brain_layer_documents_org_brain_scope_idx
  ON public.brain_layer_documents (organization_id, brain_id, scope_key, created_at DESC);

CREATE INDEX IF NOT EXISTS brain_layer_documents_org_brain_version_idx
  ON public.brain_layer_documents (organization_id, brain_id, scope_key, version DESC);

CREATE INDEX IF NOT EXISTS brain_layer_documents_output_ref_idx
  ON public.brain_layer_documents (organization_id, output_ref);

-- ---------------------------------------------------------------------------
-- Latest pointers — non-destructive current refs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_layer_latest (
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  brain_id text NOT NULL,
  scope_key text NOT NULL DEFAULT 'org',
  latest_output_ref text NOT NULL,
  latest_document_id text NOT NULL,
  latest_version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, brain_id, scope_key)
);

-- ---------------------------------------------------------------------------
-- Organizational memory records — structured retrieval
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_org_memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  memory_id text NOT NULL,
  category text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  campaign_id text,
  project_id text,
  confidence text,
  importance text,
  durability text,
  scope text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  relations jsonb NOT NULL DEFAULT '[]'::jsonb,
  graph_output_ref text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, memory_id)
);

CREATE INDEX IF NOT EXISTS brain_org_memory_records_org_category_idx
  ON public.brain_org_memory_records (organization_id, category, updated_at DESC);

CREATE INDEX IF NOT EXISTS brain_org_memory_records_org_campaign_idx
  ON public.brain_org_memory_records (organization_id, campaign_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Project runtime episodes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_project_episodes (
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  episode_id text NOT NULL,
  peer_id text NOT NULL,
  correlation_id text NOT NULL,
  episode_status text NOT NULL,
  current_state text NOT NULL,
  current_brain text,
  version integer NOT NULL DEFAULT 1,
  episode jsonb NOT NULL,
  artifacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_graphs jsonb,
  cached_learning_proposals jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_error text,
  PRIMARY KEY (organization_id, project_id)
);

CREATE INDEX IF NOT EXISTS brain_project_episodes_org_status_idx
  ON public.brain_project_episodes (organization_id, episode_status, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Project runtime events (append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  brain_id text,
  correlation_id text NOT NULL,
  output_ref text,
  customer_safe_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id, event_id)
);

CREATE INDEX IF NOT EXISTS brain_project_events_project_idx
  ON public.brain_project_events (organization_id, project_id, recorded_at ASC);

-- ---------------------------------------------------------------------------
-- Project approvals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_project_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  approval_id text NOT NULL,
  checkpoint_kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  decision text,
  actor text,
  comment text,
  related_output_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (organization_id, project_id, approval_id)
);

CREATE INDEX IF NOT EXISTS brain_project_approvals_project_idx
  ON public.brain_project_approvals (organization_id, project_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Performance observations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_performance_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  campaign_id text,
  observation_id text NOT NULL,
  ingestion_id text NOT NULL,
  source text NOT NULL,
  metric text NOT NULL,
  value numeric,
  unit text,
  measurement_window text NOT NULL,
  data_quality text NOT NULL,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, project_id, observation_id),
  UNIQUE (organization_id, project_id, ingestion_id)
);

CREATE INDEX IF NOT EXISTS brain_performance_observations_project_idx
  ON public.brain_performance_observations (organization_id, project_id, ingested_at DESC);

-- ---------------------------------------------------------------------------
-- Execution idempotency index
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brain_execution_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  idempotency_key text NOT NULL,
  execution_output_ref text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS brain_execution_idempotency_org_project_idx
  ON public.brain_execution_idempotency (organization_id, project_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS brain_layer_documents_set_updated_at ON public.brain_layer_documents;
CREATE TRIGGER brain_layer_documents_set_updated_at
  BEFORE UPDATE ON public.brain_layer_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS brain_org_memory_records_set_updated_at ON public.brain_org_memory_records;
CREATE TRIGGER brain_org_memory_records_set_updated_at
  BEFORE UPDATE ON public.brain_org_memory_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS brain_project_episodes_set_updated_at ON public.brain_project_episodes;
CREATE TRIGGER brain_project_episodes_set_updated_at
  BEFORE UPDATE ON public.brain_project_episodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.brain_layer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_layer_latest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_org_memory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_project_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_project_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_performance_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_execution_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brain layer documents readable by organization members" ON public.brain_layer_documents;
CREATE POLICY "Brain layer documents readable by organization members"
  ON public.brain_layer_documents FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain layer documents insertable by organization members" ON public.brain_layer_documents;
CREATE POLICY "Brain layer documents insertable by organization members"
  ON public.brain_layer_documents FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain layer latest readable by organization members" ON public.brain_layer_latest;
CREATE POLICY "Brain layer latest readable by organization members"
  ON public.brain_layer_latest FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain layer latest insertable by organization members" ON public.brain_layer_latest;
CREATE POLICY "Brain layer latest insertable by organization members"
  ON public.brain_layer_latest FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain layer latest updatable by organization members" ON public.brain_layer_latest;
CREATE POLICY "Brain layer latest updatable by organization members"
  ON public.brain_layer_latest FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain org memory readable by organization members" ON public.brain_org_memory_records;
CREATE POLICY "Brain org memory readable by organization members"
  ON public.brain_org_memory_records FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain org memory insertable by organization members" ON public.brain_org_memory_records;
CREATE POLICY "Brain org memory insertable by organization members"
  ON public.brain_org_memory_records FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain org memory updatable by organization members" ON public.brain_org_memory_records;
CREATE POLICY "Brain org memory updatable by organization members"
  ON public.brain_org_memory_records FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project episodes readable by organization members" ON public.brain_project_episodes;
CREATE POLICY "Brain project episodes readable by organization members"
  ON public.brain_project_episodes FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project episodes insertable by organization members" ON public.brain_project_episodes;
CREATE POLICY "Brain project episodes insertable by organization members"
  ON public.brain_project_episodes FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project episodes updatable by organization members" ON public.brain_project_episodes;
CREATE POLICY "Brain project episodes updatable by organization members"
  ON public.brain_project_episodes FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project events readable by organization members" ON public.brain_project_events;
CREATE POLICY "Brain project events readable by organization members"
  ON public.brain_project_events FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project events insertable by organization members" ON public.brain_project_events;
CREATE POLICY "Brain project events insertable by organization members"
  ON public.brain_project_events FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project approvals readable by organization members" ON public.brain_project_approvals;
CREATE POLICY "Brain project approvals readable by organization members"
  ON public.brain_project_approvals FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project approvals insertable by organization members" ON public.brain_project_approvals;
CREATE POLICY "Brain project approvals insertable by organization members"
  ON public.brain_project_approvals FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain project approvals updatable by organization members" ON public.brain_project_approvals;
CREATE POLICY "Brain project approvals updatable by organization members"
  ON public.brain_project_approvals FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain performance observations readable by organization members" ON public.brain_performance_observations;
CREATE POLICY "Brain performance observations readable by organization members"
  ON public.brain_performance_observations FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain performance observations insertable by organization members" ON public.brain_performance_observations;
CREATE POLICY "Brain performance observations insertable by organization members"
  ON public.brain_performance_observations FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain execution idempotency readable by organization members" ON public.brain_execution_idempotency;
CREATE POLICY "Brain execution idempotency readable by organization members"
  ON public.brain_execution_idempotency FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Brain execution idempotency insertable by organization members" ON public.brain_execution_idempotency;
CREATE POLICY "Brain execution idempotency insertable by organization members"
  ON public.brain_execution_idempotency FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));
