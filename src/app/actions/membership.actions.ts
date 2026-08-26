'use server';

import { createMembership } from '@/lib/services/membership.service';
import { renewMembership } from '@/lib/services/membership-renewal.service';
import { upgradeOrDowngradeMembership } from '@/lib/services/membership-upgrade.service';
import { freezeMembership, resumeMembership } from '@/lib/services/membership-freeze.service';
import { cancelMembership } from '@/lib/services/membership-lifecycle.service';
import { createMembershipPlan, updateMembershipPlan, deactivateMembershipPlan } from '@/lib/services/membership-plan.service';
import * as schemas from '@/lib/validations/membership.schema';

export async function createMembershipAction(data: unknown) {
  try {
    const parsed = schemas.createMembershipSchema.parse(data);
    const membership = await createMembership(parsed as Parameters<typeof createMembership>[0]);
    return { success: true, data: { id: membership.id, status: membership.status } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function renewMembershipAction(data: unknown) {
  try {
    const parsed = schemas.renewMembershipSchema.parse(data);
    const membership = await renewMembership(parsed as Parameters<typeof renewMembership>[0]);
    return { success: true, data: { id: membership.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function freezeMembershipAction(data: unknown) {
  try {
    const parsed = schemas.freezeMembershipSchema.parse(data);
    const freeze = await freezeMembership(parsed.membershipId, parsed.days, parsed.reason);
    return { success: true, data: { id: freeze.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function resumeMembershipAction(data: unknown) {
  try {
    const parsed = schemas.resumeMembershipSchema.parse(data);
    const updated = await resumeMembership(parsed.membershipId);
    return { success: true, data: { id: updated.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function cancelMembershipAction(data: unknown) {
  try {
    const parsed = schemas.cancelMembershipSchema.parse(data);
    const membership = await cancelMembership(parsed.membershipId, parsed.reason);
    return { success: true, data: { id: membership.id } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
