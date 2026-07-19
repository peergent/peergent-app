-- Sprint 7: Business Brain + Company DNA foundation.
-- One Business Brain and one Company DNA record per organization.

-- ---------------------------------------------------------------------------
-- Company DNA — how the company thinks and communicates
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.company_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  mission text,
  values jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone_of_voice jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision_principles jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_dna_organization_id_idx
  ON public.company_dna (organization_id);

-- ---------------------------------------------------------------------------
-- Business Brain — org-scoped business knowledge (root record only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.business_brains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brains_organization_id_idx
  ON public.business_brains (organization_id);

-- ---------------------------------------------------------------------------
-- Business Brain child entities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.business_brain_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  pricing_model text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_products_brain_idx
  ON public.business_brain_products (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  delivery_model text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_services_brain_idx
  ON public.business_brain_services (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  buying_triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_customer_segments_brain_idx
  ON public.business_brain_customer_segments (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  differentiators jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_competitors_brain_idx
  ON public.business_brain_competitors (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_internal_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_internal_processes_brain_idx
  ON public.business_brain_internal_processes (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL CHECK (
    source_type IN (
      'pdf',
      'website',
      'notion',
      'google_drive',
      'confluence',
      'email',
      'manual_note'
    )
  ),
  summary text,
  content text,
  source_url text,
  storage_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_knowledge_sources_brain_idx
  ON public.business_brain_knowledge_sources (business_brain_id, sort_order);

CREATE TABLE IF NOT EXISTS public.business_brain_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  subject text NOT NULL,
  predicate text NOT NULL,
  value text NOT NULL,
  source text,
  confidence text NOT NULL DEFAULT 'moderate' CHECK (confidence IN ('low', 'moderate', 'high')),
  verified boolean NOT NULL DEFAULT false,
  importance text NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  graph_external_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_brain_facts_brain_idx
  ON public.business_brain_facts (business_brain_id, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER company_dna_set_updated_at
  BEFORE UPDATE ON public.company_dna
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brains_set_updated_at
  BEFORE UPDATE ON public.business_brains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_products_set_updated_at
  BEFORE UPDATE ON public.business_brain_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_services_set_updated_at
  BEFORE UPDATE ON public.business_brain_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_customer_segments_set_updated_at
  BEFORE UPDATE ON public.business_brain_customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_competitors_set_updated_at
  BEFORE UPDATE ON public.business_brain_competitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_internal_processes_set_updated_at
  BEFORE UPDATE ON public.business_brain_internal_processes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_knowledge_sources_set_updated_at
  BEFORE UPDATE ON public.business_brain_knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER business_brain_facts_set_updated_at
  BEFORE UPDATE ON public.business_brain_facts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.business_brain_org_id(target_brain_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.business_brains
  WHERE id = target_brain_id;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.company_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_internal_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_brain_facts ENABLE ROW LEVEL SECURITY;

-- company_dna
CREATE POLICY "Company DNA readable by organization members"
  ON public.company_dna FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Company DNA insertable by organization members"
  ON public.company_dna FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Company DNA updatable by organization members"
  ON public.company_dna FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Company DNA deletable by organization members"
  ON public.company_dna FOR DELETE
  USING (public.is_org_member(organization_id));

-- business_brains
CREATE POLICY "Business brains readable by organization members"
  ON public.business_brains FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Business brains insertable by organization members"
  ON public.business_brains FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Business brains updatable by organization members"
  ON public.business_brains FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Business brains deletable by organization members"
  ON public.business_brains FOR DELETE
  USING (public.is_org_member(organization_id));

-- Child tables (via business_brain_org_id)
CREATE POLICY "Business brain products readable by organization members"
  ON public.business_brain_products FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain products insertable by organization members"
  ON public.business_brain_products FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain products updatable by organization members"
  ON public.business_brain_products FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain products deletable by organization members"
  ON public.business_brain_products FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain services readable by organization members"
  ON public.business_brain_services FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain services insertable by organization members"
  ON public.business_brain_services FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain services updatable by organization members"
  ON public.business_brain_services FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain services deletable by organization members"
  ON public.business_brain_services FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain customer segments readable by organization members"
  ON public.business_brain_customer_segments FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain customer segments insertable by organization members"
  ON public.business_brain_customer_segments FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain customer segments updatable by organization members"
  ON public.business_brain_customer_segments FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain customer segments deletable by organization members"
  ON public.business_brain_customer_segments FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain competitors readable by organization members"
  ON public.business_brain_competitors FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain competitors insertable by organization members"
  ON public.business_brain_competitors FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain competitors updatable by organization members"
  ON public.business_brain_competitors FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain competitors deletable by organization members"
  ON public.business_brain_competitors FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain internal processes readable by organization members"
  ON public.business_brain_internal_processes FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain internal processes insertable by organization members"
  ON public.business_brain_internal_processes FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain internal processes updatable by organization members"
  ON public.business_brain_internal_processes FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain internal processes deletable by organization members"
  ON public.business_brain_internal_processes FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain knowledge sources readable by organization members"
  ON public.business_brain_knowledge_sources FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain knowledge sources insertable by organization members"
  ON public.business_brain_knowledge_sources FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain knowledge sources updatable by organization members"
  ON public.business_brain_knowledge_sources FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain knowledge sources deletable by organization members"
  ON public.business_brain_knowledge_sources FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain facts readable by organization members"
  ON public.business_brain_facts FOR SELECT
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain facts insertable by organization members"
  ON public.business_brain_facts FOR INSERT
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain facts updatable by organization members"
  ON public.business_brain_facts FOR UPDATE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)))
  WITH CHECK (public.is_org_member(public.business_brain_org_id(business_brain_id)));

CREATE POLICY "Business brain facts deletable by organization members"
  ON public.business_brain_facts FOR DELETE
  USING (public.is_org_member(public.business_brain_org_id(business_brain_id)));
