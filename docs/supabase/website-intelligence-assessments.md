# Website Intelligence assessments (Supabase)

The Context Engine Business Brain loader reads from `public.website_intelligence_assessments`.

## Apply the migration

If the table is not visible in Supabase yet, apply local migrations:

```bash
supabase db push
```

If you use the Supabase CLI against a linked remote project:

```bash
supabase migration up
```

Migration file:

`supabase/migrations/20250718100000_website_intelligence_assessments.sql`

## Verify

After running Website Intelligence in the app, you should see a row in:

`public.website_intelligence_assessments`

with:

- `organization_id`
- `source_url`
- `analyzed_at`
- `assessment` (full JSON payload)
- `created_at`

## RLS

Org members can select and insert rows for organizations they belong to via `public.is_org_member(organization_id)`.
