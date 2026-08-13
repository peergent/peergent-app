-- PX-50.2: Allow authenticated server actions to invoke versioned episode upsert RPC.

GRANT EXECUTE ON FUNCTION public.upsert_brain_project_episode_versioned(
  uuid,
  text,
  integer,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) TO authenticated, service_role;
