# Marketing Agent — Internal Peergent Pilot

Use this configuration for the **Peergent development tenant** before external customers. No separate “pilot mode” flag — express safety through existing responsibility and guardrail persistence.

## Target autonomy: Always ask

In **Settings → Autonomy**, select **Always ask**, or apply programmatically:

```typescript
import { applyPilotSafeAutonomy } from "@/features/marketing-workspace/lib/marketing-settings-policy";

// After loading workspace responsibilities for the Marketing peer:
updateResponsibilities(applyPilotSafeAutonomy(responsibilities));
```

`applyPilotSafeAutonomy` sets:

- General mode → `always_ask` (`suggest` autonomy on enabled responsibilities)
- Posting → approval required (no routine auto-publish)
- Website → blog auto-publish off; material changes require review
- Email → approval required
- Advertising budget → autonomous limit **0** (any spend needs a decision)
- `approvalPolicy: approval_required` and `guardrails.approvalRequired: true` on enabled responsibilities

## Allowed without explicit decision

- Analyze connected data (read-only integrations)
- Generate recommendations and brain insights
- Create projects and WorkUnits from responsibilities
- Generate content **drafts** and previews
- Propose schedules (stored as intent, not executed)
- Create **Review** queue items (`ready_for_review`)
- Record activity and learning insights

## Not allowed without an approved decision

- External publish (social, blog live, etc.)
- Send email / newsletter
- Advertising spend or campaign launch
- Public website changes
- Irreversible production mutations

Enforcement is via:

- `approval_required` / draft `ready_for_review` gating
- `handlePreparePublication` / `handlePublishNowApproval` requiring connected channel **and** approved draft
- Settings area rules above

## Reset after policy experiments

After testing autonomy in step 24 of the acceptance checklist, re-run **Always ask** + area toggles off (or `applyPilotSafeAutonomy` again) and confirm **Settings → Autonomy** shows **Always ask**.

## Where state lives

- `loadMarketingWorkspaceState(peerId)` → `responsibilities`, `drafts`, `workUnits`, `activityFeed`
- Persisted per peer in local workspace storage (development); mutations via `useMarketingWorkspace` → `persistState`

## Related checklist

See [PILOT_ACCEPTANCE_CHECKLIST.md](./PILOT_ACCEPTANCE_CHECKLIST.md) for the 25-step manual verification on the dev tenant.
