-- Persist Website Intelligence assessments per organization for Context Engine / Business Brain.

CREATE TABLE IF NOT EXISTS public.website_intelligence_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  analyzed_at timestamptz NOT NULL,
  assessment jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_intelligence_assessments_org_analyzed_idx
  ON public.website_intelligence_assessments (organization_id, analyzed_at DESC);

ALTER TABLE public.website_intelligence_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Website intelligence assessments readable by organization members" ON public.website_intelligence_assessments;
CREATE POLICY "Website intelligence assessments readable by organization members"
  ON public.website_intelligence_assessments
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "Website intelligence assessments insertable by organization members" ON public.website_intelligence_assessments;
CREATE POLICY "Website intelligence assessments insertable by organization members"
  ON public.website_intelligence_assessments
  FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "Website intelligence assessments updatable by organization members" ON public.website_intelligence_assessments;
CREATE POLICY "Website intelligence assessments updatable by organization members"
  ON public.website_intelligence_assessments
  FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );
