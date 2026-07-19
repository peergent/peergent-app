-- Sprint 9.1: Marketing Intelligence foundation.
-- One marketing profile per organization; goals and content as child entities.

CREATE TABLE IF NOT EXISTS public.marketing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  brand_positioning jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_profiles_organization_id_idx
  ON public.marketing_profiles (organization_id);

CREATE TABLE IF NOT EXISTS public.marketing_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_profile_id uuid NOT NULL REFERENCES public.marketing_profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority integer NOT NULL DEFAULT 0,
  timeframe text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_goals_profile_idx
  ON public.marketing_goals (marketing_profile_id, sort_order);

CREATE TABLE IF NOT EXISTS public.marketing_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_profile_id uuid NOT NULL REFERENCES public.marketing_profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'other',
  channel text,
  summary text,
  source_url text,
  published_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_content_items_profile_idx
  ON public.marketing_content_items (marketing_profile_id, sort_order);

CREATE OR REPLACE FUNCTION public.marketing_profile_org_id(profile_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id FROM public.marketing_profiles WHERE id = profile_id;
$$;

CREATE TRIGGER marketing_profiles_updated_at
  BEFORE UPDATE ON public.marketing_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER marketing_goals_updated_at
  BEFORE UPDATE ON public.marketing_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER marketing_content_items_updated_at
  BEFORE UPDATE ON public.marketing_content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing profiles readable by organization members"
  ON public.marketing_profiles FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Marketing profiles insertable by organization members"
  ON public.marketing_profiles FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Marketing profiles updatable by organization members"
  ON public.marketing_profiles FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Marketing profiles deletable by organization members"
  ON public.marketing_profiles FOR DELETE
  USING (public.is_org_member(organization_id));

CREATE POLICY "Marketing goals readable by organization members"
  ON public.marketing_goals FOR SELECT
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing goals insertable by organization members"
  ON public.marketing_goals FOR INSERT
  WITH CHECK (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing goals updatable by organization members"
  ON public.marketing_goals FOR UPDATE
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)))
  WITH CHECK (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing goals deletable by organization members"
  ON public.marketing_goals FOR DELETE
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing content items readable by organization members"
  ON public.marketing_content_items FOR SELECT
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing content items insertable by organization members"
  ON public.marketing_content_items FOR INSERT
  WITH CHECK (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing content items updatable by organization members"
  ON public.marketing_content_items FOR UPDATE
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)))
  WITH CHECK (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));

CREATE POLICY "Marketing content items deletable by organization members"
  ON public.marketing_content_items FOR DELETE
  USING (public.is_org_member(public.marketing_profile_org_id(marketing_profile_id)));
