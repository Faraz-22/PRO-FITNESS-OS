import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { createMembershipPlan, deactivateMembershipPlan } from '../src/lib/services/membership-plan.service';
import { createMembership } from '../src/lib/services/membership.service';
import { cancelMembership, syncMembershipExpirations } from '../src/lib/services/membership-lifecycle.service';
import { freezeMembership, resumeMembership } from '../src/lib/services/membership-freeze.service';
import { renewMembership } from '../src/lib/services/membership-renewal.service';
import { upgradeOrDowngradeMembership } from '../src/lib/services/membership-upgrade.service';
import { calculateFinalPricing } from '../src/lib/services/membership-pricing.service';
import { MembershipPlanType, PricingType } from '@prisma/client';

let mockRole = 'SUPER_ADMIN';
let mockUserId = '';

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn().mockImplementation(async () => {
    if (!mockUserId) return null;
    return { user: { id: mockUserId, role: mockRole } };
  })
}));

describe('Phase 2C Membership & Subscription Domain', () => {
  let mainBranchId = '';
  let otherBranchId = '';
  let superAdminId = '';
  let receptionistId = '';
  let member1Id = '';
  let member2Id = '';
  let plan1Id = '';
  const plan2Id = '';

  beforeAll(async () => {
    const b1 = await prisma.branch.create({ data: { name: 'Main', code: 'MB-' + Date.now() + Math.random() } });
    const b2 = await prisma.branch.create({ data: { name: 'Other', code: 'OB-' + Date.now() + Math.random() } });
    mainBranchId = b1.id;
    otherBranchId = b2.id;

    const sa = await prisma.user.create({ data: { name: 'SA', email: 'sa-' + Date.now() + Math.random() + '@test.com', role: 'SUPER_ADMIN' } });
    superAdminId = sa.id;
    mockUserId = superAdminId;
    mockRole = 'SUPER_ADMIN';

    const u1 = await prisma.user.create({ data: { name: 'M1', email: 'm1_mem-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
    const m1 = await prisma.memberProfile.create({ data: { userId: u1.id, branchId: mainBranchId, memberNumber: 'M1-' + Date.now(), firstName: 'M1', lastName: 'L1' } });
    member1Id = m1.id;

    const u2 = await prisma.user.create({ data: { name: 'M2', email: 'm2_mem-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
    const m2 = await prisma.memberProfile.create({ data: { userId: u2.id, branchId: otherBranchId, memberNumber: 'M2-' + Date.now(), firstName: 'M2', lastName: 'L2' } });
    member2Id = m2.id;

    const recUser = await prisma.user.create({ data: { name: 'Rec', email: 'rec_mem-' + Date.now() + Math.random() + '@test.com', role: 'RECEPTIONIST' } });
    receptionistId = recUser.id;
    await prisma.staffProfile.create({ data: { userId: receptionistId, branchId: mainBranchId, employeeId: 'R1', firstName: 'R1', lastName: 'R1', department: 'RECEPTION' } });
  });

  afterAll(async () => {
    await prisma.businessActivityLog.deleteMany();
    await prisma.membershipStatusHistory.deleteMany();
    await prisma.membershipFreeze.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.membershipPlan.deleteMany();
    await prisma.trainerAssignment.deleteMany();
    await prisma.workoutPlan.deleteMany();
    await prisma.trainerProfile.deleteMany();
    await prisma.staffProfile.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.paymentAllocation.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.billingIntent.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.workoutSet.deleteMany();
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.deviceMemberIdentity.deleteMany();
    await prisma.memberProfile.deleteMany();
    await prisma.deviceAccessEvent.deleteMany();
    await prisma.accessDevice.deleteMany();
    await prisma.branch.deleteMany({ where: { id: { in: [mainBranchId, otherBranchId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [superAdminId, receptionistId] } } });
  });

  beforeEach(() => {
    mockUserId = superAdminId;
    mockRole = 'SUPER_ADMIN';
  });

  describe('Pricing Logic', () => {
    it('should calculate exact decimals', () => {
      const p = calculateFinalPricing(1000, 250);
      expect(p.basePrice.toString()).toBe('1000');
      expect(p.discountAmount.toString()).toBe('250');
      expect(p.finalAmount.toString()).toBe('750');
    });

    it('should throw on negative base price', () => {
      expect(() => calculateFinalPricing(-100, 0)).toThrow();
    });

    it('should throw on negative discount', () => {
      expect(() => calculateFinalPricing(100, -10)).toThrow();
    });

    it('should throw if discount exceeds base price', () => {
      expect(() => calculateFinalPricing(100, 150)).toThrow();
    });
  });

  describe('Plan Management', () => {
    it('should allow SuperAdmin to create a plan', async () => {
      const plan = await createMembershipPlan({
        branchId: mainBranchId,
        name: 'Gold Monthly',
        code: 'GOLD_1M',
        durationDays: 30,
        price: 5000,
        benefits: ['Gym'],
        planType: MembershipPlanType.MONTHLY,
      });
      expect(plan.id).toBeDefined();
      plan1Id = plan.id;
    });

    it('should reject plan creation from Receptionist', async () => {
      mockUserId = receptionistId;
      mockRole = 'RECEPTIONIST';
      await expect(createMembershipPlan({
        branchId: mainBranchId,
        name: 'Silver',
        code: 'SILVER_1M',
        durationDays: 30,
        price: 3000,
        benefits: [],
        planType: MembershipPlanType.MONTHLY,
      })).rejects.toThrow('Only managers and admins can manage plans');
    });
  });

  describe('Membership Creation', () => {
    it('should successfully create a valid PAID membership', async () => {
      const m = await createMembership({
        memberId: member1Id,
        planId: plan1Id,
        branchId: mainBranchId,
      });
      expect(m.status).toBe('PENDING_PAYMENT');
      expect(m.basePrice.toString()).toBe('5000');
    });

    it('should reject duplicate active/pending membership for same member', async () => {
      await expect(createMembership({
        memberId: member1Id,
        planId: plan1Id,
        branchId: mainBranchId,
      })).rejects.toThrow(/Membership dates overlap/);
    });

    it('should reject creation for a cross-branch member', async () => {
      await expect(createMembership({
        memberId: member2Id,
        planId: plan1Id,
        branchId: mainBranchId,
      })).rejects.toThrow('BranchMismatch: Member belongs to a different branch');
    });
  });

  describe('Lifecycle: Freeze & Cancel', () => {
    let memId = '';
    beforeAll(async () => {
      const plan = await createMembershipPlan({ branchId: otherBranchId, name: 'T1', code: 'T1', durationDays: 30, price: 1000, benefits: [], planType: MembershipPlanType.MONTHLY });
      const m = await createMembership({ memberId: member2Id, planId: plan.id, branchId: otherBranchId, pricingType: PricingType.COMPLIMENTARY });
      memId = m.id;
    });

    it('should reject freezing a non-ACTIVE membership', async () => {
      // Create a PENDING_PAYMENT one for m1
      const m1Pending = await prisma.membership.findFirst({ where: { memberId: member1Id } });
      await expect(freezeMembership(m1Pending!.id, 5, 'Sick')).rejects.toThrow('Cannot freeze membership in status PENDING_PAYMENT');
    });

    it('should successfully freeze an ACTIVE membership', async () => {
      const freeze = await freezeMembership(memId, 5, 'Vacation');
      expect(freeze.days).toBe(5);
      const m = await prisma.membership.findUnique({ where: { id: memId } });
      expect(m!.status).toBe('FROZEN');
    });

    it('should prevent double freezing', async () => {
      await expect(freezeMembership(memId, 5, 'Vacation 2')).rejects.toThrow('Cannot freeze membership in status FROZEN');
    });

    it('should resume and extend end date', async () => {
      const before = await prisma.membership.findUnique({ where: { id: memId } });
      await resumeMembership(memId);
      const after = await prisma.membership.findUnique({ where: { id: memId } });
      expect(after!.status).toBe('ACTIVE');
      expect(after!.endDate.getTime()).toBeGreaterThan(before!.endDate.getTime());
    });

    it('should cancel the membership', async () => {
      await cancelMembership(memId, 'Requested');
      const m = await prisma.membership.findUnique({ where: { id: memId } });
      expect(m!.status).toBe('CANCELLED');
    });
  });

  describe('Renewal', () => {
    let oldMemId = '';
    let planId2 = '';
    beforeAll(async () => {
      const p = await createMembershipPlan({ branchId: otherBranchId, name: 'R1', code: 'R1', durationDays: 30, price: 1000, benefits: [], planType: MembershipPlanType.MONTHLY });
      planId2 = p.id;
      const m = await createMembership({ memberId: member2Id, planId: p.id, branchId: otherBranchId, pricingType: PricingType.COMPLIMENTARY });
      // We force it to EXPIRED for testing renewal without unique constraint violation
      await prisma.membership.update({ where: { id: m.id }, data: { status: 'EXPIRED' } });
      oldMemId = m.id;
    });

    it('should renew an expired membership, preserving old history', async () => {
      const newMem = await renewMembership({
        previousMembershipId: oldMemId,
        planId: planId2,
        pricingType: PricingType.COMPLIMENTARY,
      });
      expect(newMem.id).not.toBe(oldMemId);
      expect(newMem.status).toBe('ACTIVE');
      
      const oldMem = await prisma.membership.findUnique({ where: { id: oldMemId } });
      expect(oldMem!.status).toBe('EXPIRED');

      // Test Early Renewal (Creates PENDING_PAYMENT)
      const earlyRenew = await renewMembership({
        previousMembershipId: newMem.id,
        planId: planId2,
        pricingType: PricingType.PAID
      });
      expect(earlyRenew.status).toBe('PENDING_PAYMENT');
      expect(earlyRenew.startDate.getTime()).toBeGreaterThan(newMem.endDate.getTime()); // Starts strictly after

      // Test Overlap validation
      await expect(createMembership({
        memberId: member2Id,
        branchId: otherBranchId,
        planId: planId2,
      })).rejects.toThrow(/Membership dates overlap/);

      // Test Sequence Idempotency
      await expect(renewMembership({
        previousMembershipId: newMem.id,
        planId: planId2,
      })).rejects.toThrow('A scheduled renewal already exists for this membership');
    });
  });

  describe('Concurrency & Overlap Hardening (Phase 2C.1)', () => {
    let concMemId = '';
    let concPlanId = '';
    let tempMemberId = '';

    beforeAll(async () => {
      const p = await createMembershipPlan({ branchId: mainBranchId, name: 'C1', code: 'C1', durationDays: 30, price: 1000, benefits: [], planType: MembershipPlanType.MONTHLY });
      concPlanId = p.id;
      
      const tempUser = await prisma.user.create({ data: { name: 'T3', email: 't3_temp-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
      const tempMember = await prisma.memberProfile.create({ data: { userId: tempUser.id, branchId: mainBranchId, memberNumber: 'T3', firstName: 'T', lastName: '3' } });
      tempMemberId = tempMember.id;

      const m = await createMembership({ memberId: tempMember.id, planId: p.id, branchId: mainBranchId, pricingType: PricingType.COMPLIMENTARY });
      concMemId = m.id;
    });

    it('should handle concurrent overlapping creation gracefully', async () => {
      const tempUser4 = await prisma.user.create({ data: { name: 'T4', email: 't4_temp-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
      const tempMember4 = await prisma.memberProfile.create({ data: { userId: tempUser4.id, branchId: mainBranchId, memberNumber: 'T4-' + Date.now(), firstName: 'T', lastName: '4' } });

      const results = await Promise.allSettled([
        createMembership({ memberId: tempMember4.id, planId: concPlanId, branchId: mainBranchId }),
        createMembership({ memberId: tempMember4.id, planId: concPlanId, branchId: mainBranchId })
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      if (rejected[0] && rejected[0].status === 'rejected') {
        expect((rejected[0].reason as Error).message).toMatch(/overlap/i);
      }
    });

    it('should handle concurrent renewals idempotently', async () => {
      const results = await Promise.allSettled([
        renewMembership({ previousMembershipId: concMemId, planId: concPlanId }),
        renewMembership({ previousMembershipId: concMemId, planId: concPlanId }),
        renewMembership({ previousMembershipId: concMemId, planId: concPlanId })
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(2);
      if (rejected[0] && rejected[0].status === 'rejected') {
        expect((rejected[0].reason as Error).message).toMatch(/scheduled renewal already exists/i);
      }
    });

    it('should handle concurrent activation gracefully', async () => {
      const scheduled = await prisma.membership.findFirst({ where: { previousMembershipId: concMemId } });
      expect(scheduled).toBeDefined();
      
      const { activateScheduledMembership } = await import('../src/lib/services/membership-activation.service');

      // Make it eligible
      await prisma.membership.update({
        where: { id: scheduled!.id },
        data: { startDate: new Date(Date.now() - 100000) }
      });
      await prisma.membership.update({
        where: { id: concMemId },
        data: { status: 'EXPIRED', endDate: new Date(Date.now() - 200000) }
      });

      const results = await Promise.allSettled([
        activateScheduledMembership(scheduled!.id),
        activateScheduledMembership(scheduled!.id)
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      if (rejected[0] && rejected[0].status === 'rejected') {
        expect((rejected[0].reason as Error).message).toMatch(/already active/i);
      }
    });

    it('should resequence scheduled renewal automatically when current membership is frozen', async () => {
      const tempUser5 = await prisma.user.create({ data: { name: 'T5', email: 't5_temp-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
      const tempMember5 = await prisma.memberProfile.create({ data: { userId: tempUser5.id, branchId: mainBranchId, memberNumber: 'T5-' + Date.now(), firstName: 'T', lastName: '5' } });

      const m1 = await createMembership({ memberId: tempMember5.id, planId: concPlanId, branchId: mainBranchId, pricingType: PricingType.COMPLIMENTARY });
      const m2 = await renewMembership({ previousMembershipId: m1.id, planId: concPlanId, pricingType: PricingType.PAID });

      const initialScheduledStart = m2.startDate.getTime();
      const initialScheduledEnd = m2.endDate.getTime();

      await freezeMembership(m1.id, 5, 'Resequence test');
      await resumeMembership(m1.id);

      const shiftedM2 = await prisma.membership.findUnique({ where: { id: m2.id } });
      expect(shiftedM2!.startDate.getTime()).toBeGreaterThan(initialScheduledStart);
      expect(shiftedM2!.endDate.getTime()).toBeGreaterThan(initialScheduledEnd);
    });
  });
});
