-- PX-55: brain_layer_documents UPSERT requires UPDATE RLS (conflict path uses UPDATE).
-- brain_layer_documents had SELECT + INSERT only; upsert on existing rows failed USING check.
-- Tenant isolation unchanged: is_org_member(organization_id) on UPDATE matches INSERT/SELECT.

DROP POLICY IF EXISTS "Brain layer documents updatable by organization members" ON public.brain_layer_documents;
CREATE POLICY "Brain layer documents updatable by organization members"
  ON public.brain_layer_documents FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- brain_execution_idempotency upsert also hits UPDATE on conflict; same gap.
DROP POLICY IF EXISTS "Brain execution idempotency updatable by organization members" ON public.brain_execution_idempotency;
CREATE POLICY "Brain execution idempotency updatable by organization members"
  ON public.brain_execution_idempotency FOR UPDATE
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
