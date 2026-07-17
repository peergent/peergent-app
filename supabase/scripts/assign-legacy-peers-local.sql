-- Local development only: assign legacy peers without organization_id
-- to a single organization you own.
--
-- Run in the Supabase SQL editor (uses postgres role; does not weaken RLS).
-- Do NOT run in production without reviewing orphan peer ownership first.
--
-- Prerequisites:
-- 1. You are signed up and have at least one organization membership.
-- 2. Legacy peers have organization_id IS NULL.

DO $$
DECLARE
  target_org_id uuid;
BEGIN
  SELECT om.organization_id
  INTO target_org_id
  FROM public.organization_members om
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF target_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization membership found. Sign up first.';
  END IF;

  UPDATE public.peers
  SET organization_id = target_org_id
  WHERE organization_id IS NULL;

  RAISE NOTICE 'Assigned legacy peers to organization %', target_org_id;
END $$;
