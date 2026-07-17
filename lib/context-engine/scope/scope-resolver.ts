import type { SupabaseClient } from "@supabase/supabase-js";
import { getPrimaryOrganizationForUser } from "@/lib/organizations/queries";
import type { Database } from "@/lib/supabase/database.types";
import {
  MissingScopeError,
  OrganizationNotFoundError,
  PeerNotFoundError,
  ScopeAccessError,
} from "../core/errors";
import { toPeerRole } from "../data/peer-role";
import {
  fetchOrganizationById,
  fetchOrganizationMember,
  fetchPeerForContext,
} from "../data/queries";
import type { BuildContextRequest, ContextScope } from "../types";
import { createSessionId } from "./resolve-scope";

type AppSupabaseClient = SupabaseClient<Database>;

export class ScopeResolver {
  async resolve(
    supabase: AppSupabaseClient,
    request: BuildContextRequest
  ): Promise<ContextScope> {
    const peerId = request.peerId.trim();
    const userId = request.userId.trim();

    if (!peerId || !userId) {
      throw new MissingScopeError("peerId and userId are required.");
    }

    let organizationId = request.organizationId.trim();
    let membershipRole = request.membershipRole;

    if (organizationId) {
      const membership = await fetchOrganizationMember(
        supabase,
        userId,
        organizationId
      );

      if (!membership) {
        throw new ScopeAccessError(
          "User is not a member of the requested organization."
        );
      }

      membershipRole = membership.role;
    } else {
      const primaryOrganization = await getPrimaryOrganizationForUser(
        supabase,
        userId
      );

      if (!primaryOrganization) {
        throw new ScopeAccessError("No active organization found for user.");
      }

      organizationId = primaryOrganization.id;
      membershipRole = primaryOrganization.role;
    }

    const [organization, peer] = await Promise.all([
      fetchOrganizationById(supabase, organizationId),
      fetchPeerForContext(supabase, peerId, organizationId),
    ]);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (!peer) {
      throw new PeerNotFoundError(peerId, organizationId);
    }

    return {
      organization: {
        organizationId: organization.id,
        organizationName: organization.name,
        slug: organization.slug,
      },
      peer: {
        peerId: peer.id,
        role: toPeerRole(peer.role),
        name: peer.name,
        objective: peer.objective,
        website: peer.website,
        status: peer.status,
      },
      actor: {
        userId,
        membershipRole: membershipRole ?? "member",
      },
      sessionId: createSessionId(),
      requestedAt: new Date().toISOString(),
    };
  }
}

export const defaultScopeResolver = new ScopeResolver();
