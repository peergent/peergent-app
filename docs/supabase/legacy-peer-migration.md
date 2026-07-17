# Legacy demo peers (local development)

Peers created before Sprint 5.1 may have `organization_id = NULL`. With org-scoped RLS, those rows are **not readable** by any authenticated user until assigned to an organization.

## Do not weaken RLS

Production isolation depends on organization membership. Never expose null-organization peers across tenants.

## Assign legacy peers to your dev organization

1. Sign up and create an organization (or use an existing dev account).
2. Open the Supabase SQL editor for your project.
3. Run:

   `supabase/scripts/assign-legacy-peers-local.sql`

This assigns all `organization_id IS NULL` peers to the **oldest** organization membership in the database. Intended for local/dev databases only.

## Verify

```sql
SELECT id, name, organization_id FROM peers ORDER BY created_at DESC;
```

After assignment, sign in and open `/peers` — peers should appear for that organization only.

## New hires

The hire-team flow always sets `organization_id` from the active account context. New peers must not be created without an organization.
