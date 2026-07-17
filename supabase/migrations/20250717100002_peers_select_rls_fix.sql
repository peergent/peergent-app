-- Sprint 5.1.2: Close peers SELECT leak for organization_id IS NULL
-- Run this if 20250717100000_auth_and_organizations.sql was already applied
-- with the previous SELECT policy.

drop policy if exists "Peers readable by organization members" on public.peers;

create policy "Peers readable by organization members"
  on public.peers
  for select
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );
