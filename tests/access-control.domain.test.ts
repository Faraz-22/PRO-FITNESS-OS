import 'dotenv/config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { MemberAccessEligibilityService } from '../src/lib/services/member-access-eligibility.service';
import { MemberAccessPolicyService } from '../src/lib/services/member-access-policy.service';
import { AttendanceSyncService } from '../src/lib/services/attendance-sync.service';
import { AttendanceInterpretationService } from '../src/lib/services/attendance-interpretation.service';
import { DeviceReconciliationService } from '../src/lib/services/device-reconciliation.service';
import { ESSLMB20MockAdapter } from '../src/lib/integrations/access-control/essl-mb20.adapter';

vi.mock('../src/lib/integrations/access-control/essl-mb20.adapter', () => {
  return {
    ESSLMB20MockAdapter: class {
      connect = vi.fn().mockResolvedValue(undefined);
      disconnect = vi.fn().mockResolvedValue(undefined);
      getAttendanceEvents = vi.fn().mockResolvedValue([
        { externalEventId: 'evt_1', externalUserId: 'ext_u1', timestamp: new Date(), eventType: 'ACCESS_ALLOWED', rawPayload: {} },
        { externalEventId: 'evt_1', externalUserId: 'ext_u1', timestamp: new Date(), eventType: 'ACCESS_ALLOWED', rawPayload: {} } // Simulate dup
      ]);
      enableUser = vi.fn().mockResolvedValue(undefined);
      disableUser = vi.fn().mockResolvedValue(undefined);
    }
  };
});

async function seedAccessEnv() {
  const branch = await prisma.branch.create({
    data: { name: 'Access Branch', code: `AC-${Date.now()}` }
  });

  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@test.com`,
      name: 'Test User',
      role: 'MEMBER'
    }
  });

  const member = await prisma.memberProfile.create({
    data: {
      userId: user.id,
      memberNumber: `MEM-${Date.now()}`,
      branchId: branch.id,
      firstName: 'Test',
      lastName: 'Access',
      status: 'ACTIVE'
    }
  });

  const device = await prisma.accessDevice.create({
    data: {
      name: 'Main Door',
      deviceType: 'MB20',
      manufacturer: 'eSSL',
      model: 'MB20',
      branchId: branch.id,
      connectionMode: 'MOCK'
    }
  });

  const plan = await prisma.membershipPlan.create({
    data: {
      name: 'Plan',
      code: `P-${Date.now()}`,
      branchId: branch.id,
      durationDays: 30,
      price: 100,
      planType: 'MONTHLY'
    }
  });

  const identity = await prisma.deviceMemberIdentity.create({
    data: {
      memberId: member.id,
      deviceId: device.id,
      externalUserId: `ext_${member.id}`,
      desiredEnabled: true,
      actualEnabled: false
    }
  });

  return { branch, member, device, plan, identity };
}

describe('Phase 2E - Access Control & Attendance Domain', () => {

  describe('Member Access Eligibility', () => {
    it('1. should deny access if member has no membership', async () => {
      const { member, branch } = await seedAccessEnv();
      const res = await MemberAccessEligibilityService.canMemberAccessGym(member.id, branch.id);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('NO_MEMBERSHIP');
    });

    it('2. should allow access for ACTIVE membership', async () => {
      const env = await seedAccessEnv();
      await prisma.membership.create({
        data: {
          memberId: env.member.id,
          branchId: env.branch.id,
          planId: env.plan.id,
          planNameSnapshot: 'Plan',
          durationDaysSnapshot: 30,
          basePrice: 100,
          finalAmount: 100,
          startDate: new Date(Date.now() - 100000),
          endDate: new Date(Date.now() + 100000),
          status: 'ACTIVE'
        }
      });
      const res = await MemberAccessEligibilityService.canMemberAccessGym(env.member.id, env.branch.id);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBe('ACTIVE_MEMBERSHIP');
    });

    it('3. should deny access for expired membership', async () => {
      const env = await seedAccessEnv();
      await prisma.membership.create({
        data: {
          memberId: env.member.id, branchId: env.branch.id, planId: env.plan.id,
          planNameSnapshot: 'Plan', durationDaysSnapshot: 30, basePrice: 100, finalAmount: 100,
          startDate: new Date(Date.now() - 200000), endDate: new Date(Date.now() - 100000), status: 'EXPIRED'
        }
      });
      const res = await MemberAccessEligibilityService.canMemberAccessGym(env.member.id, env.branch.id);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('MEMBERSHIP_EXPIRED');
    });

    it('4. should deny access for wrong branch', async () => {
      const env = await seedAccessEnv();
      await prisma.membership.create({
        data: {
          memberId: env.member.id, branchId: env.branch.id, planId: env.plan.id,
          planNameSnapshot: 'Plan', durationDaysSnapshot: 30, basePrice: 100, finalAmount: 100,
          startDate: new Date(Date.now() - 100000), endDate: new Date(Date.now() + 100000), status: 'ACTIVE'
        }
      });
      const wrongBranch = await prisma.branch.create({ data: { name: 'Wrong', code: `W-${Date.now()}` } });
      const res = await MemberAccessEligibilityService.canMemberAccessGym(env.member.id, wrongBranch.id);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('BRANCH_MISMATCH');
    });
  });

  describe('Member Access Policy Sync', () => {
    it('5. evaluates policy and updates desiredEnabled to true for active members', async () => {
      const env = await seedAccessEnv();
      await prisma.membership.create({
        data: {
          memberId: env.member.id, branchId: env.branch.id, planId: env.plan.id,
          planNameSnapshot: 'Plan', durationDaysSnapshot: 30, basePrice: 100, finalAmount: 100,
          startDate: new Date(Date.now() - 100000), endDate: new Date(Date.now() + 100000), status: 'ACTIVE'
        }
      });
      
      // Set to false initially
      await prisma.deviceMemberIdentity.update({ where: { id: env.identity.id }, data: { desiredEnabled: false } });
      await MemberAccessPolicyService.evaluateMemberAccessPolicy(env.member.id);
      
      const identity = await prisma.deviceMemberIdentity.findUnique({ where: { id: env.identity.id } });
      expect(identity?.desiredEnabled).toBe(true);
      expect(identity?.syncStatus).toBe('PENDING');
    });
  });

  describe('Device Reconciliation', () => {
    it('6. detects sync drift correctly', async () => {
      const env = await seedAccessEnv();
      // set syncStatus to FAILED so reconciliation picks it up and turns it to RETRYING
      await prisma.deviceMemberIdentity.update({ where: { id: env.identity.id }, data: { syncStatus: 'FAILED' } });
      
      const driftCount = await DeviceReconciliationService.detectDrift(env.device.id);
      expect(driftCount).toBe(1);
      
      const updated = await prisma.deviceMemberIdentity.findUnique({ where: { id: env.identity.id } });
      expect(updated?.syncStatus).toBe('RETRYING');
    });
  });

  describe('Attendance Sync & Idempotency', () => {
    it('7. safely ingests raw events and drops duplicates natively', async () => {
      const env = await seedAccessEnv();
      
      // Mock returns 2 identical events with externalEventId = 'evt_1'
      // 1 should insert, 1 should fail silently due to P2002
      await AttendanceSyncService.syncEvents(env.device.id);
      
      const events = await prisma.deviceAccessEvent.findMany({ where: { deviceId: env.device.id } });
      expect(events.length).toBe(1); // Idempotency check passed
    });
  });
  
  describe('Attendance Interpretation', () => {
    it('8. interprets raw event as check-in', async () => {
      const env = await seedAccessEnv();
      
      await prisma.deviceAccessEvent.create({
        data: {
          deviceId: env.device.id,
          externalEventId: `evt_${Date.now()}`,
          externalUserId: env.identity.externalUserId,
          eventTimestamp: new Date(),
          eventType: 'ACCESS_ALLOWED',
          rawPayload: {},
          processingStatus: 'UNPROCESSED'
        }
      });
      
      await AttendanceInterpretationService.interpretEvents(env.device.id);
      
      const records = await prisma.attendanceRecord.findMany({ where: { memberId: env.member.id } });
      expect(records.length).toBe(1);
      expect(records[0]?.checkOutTime).toBeNull();
      expect(records[0]?.accessDecision).toBe('ALLOWED');
    });
  });

});
