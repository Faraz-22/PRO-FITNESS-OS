import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { resolveLeadIdentity } from '../src/lib/services/identity-resolution.service';
import { convertLead, IdentityConflictError, LeadAlreadyConvertedError } from '../src/lib/services/lead-conversion.service';
import { createLead, changeLeadStatus, InvalidLeadTransitionError } from '../src/lib/services/lead.service';
import { requireBranchAccess, CrossBranchAccessError } from '../src/lib/auth/branch-access';

describe('Phase 2B CRM & Lead Management', () => {
  let mainBranchId = '';
  let otherBranchId = '';
  let superAdminId = '';
  let receptionistId = '';
  let dummyUserId = '';
  let staffId = '';
  const dummyLeadId = '';

  beforeAll(async () => {
    // Setup test data
    const b1 = await prisma.branch.create({ data: { name: 'Test Branch Main', code: 'TB-MAIN-' + Date.now() + Math.random() } });
    const b2 = await prisma.branch.create({ data: { name: 'Test Branch Other', code: 'TB-OTHER-' + Date.now() + Math.random() } });
    mainBranchId = b1.id;
    otherBranchId = b2.id;

    const saUser = await prisma.user.create({ data: { name: 'SA', email: 'sa-' + Date.now() + Math.random() + '@test.com', role: 'SUPER_ADMIN' } });
    superAdminId = saUser.id;

    const rUser = await prisma.user.create({ data: { name: 'Rec', email: 'rec-' + Date.now() + Math.random() + '@test.com', role: 'RECEPTIONIST' } });
    receptionistId = rUser.id;
    
    const staff = await prisma.staffProfile.create({ 
      data: { userId: rUser.id, branchId: mainBranchId, employeeId: 'E1', firstName: 'R', lastName: 'R', department: 'RECEPTION' } 
    });
    staffId = staff.id;

    const dummyUser = await prisma.user.create({ data: { name: 'User1', email: 'user1-' + Date.now() + Math.random() + '@test.com', role: 'MEMBER' } });
    dummyUserId = dummyUser.id;
  });

  afterAll(async () => {
    await prisma.leadFollowUp.deleteMany();
    await prisma.leadStatusHistory.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.trainerAssignment.deleteMany();
    await prisma.workoutPlan.deleteMany();
    await prisma.trainerProfile.deleteMany();
    await prisma.staffProfile.deleteMany();
    await prisma.workoutSession.deleteMany();
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
    await prisma.membership.deleteMany();
    await prisma.memberProfile.deleteMany();
    await prisma.deviceAccessEvent.deleteMany();
    await prisma.accessDevice.deleteMany();
    await prisma.membershipPlan.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Identity Resolution & Conversion', () => {
    it('should resolve to NO_MATCH for a completely new lead', async () => {
      const res = await resolveLeadIdentity('9999999999', 'new@test.com');
      expect(res.type).toBe('NO_MATCH');
    });

    it('should resolve to USER_MATCH if user exists without member profile', async () => {
      const user = await prisma.user.findUnique({ where: { id: dummyUserId } });
      const res = await resolveLeadIdentity('9999999998', user!.email);
      expect(res.type).toBe('USER_MATCH');
    });

    it('should successfully convert a NO_MATCH lead', async () => {
      const lead = await createLead({
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234560000',
        email: `john${Date.now()}@test.com`,
        source: 'WALK_IN',
        priority: 'MEDIUM',
        branchId: mainBranchId
      }, superAdminId);

      const result = await convertLead(lead.id, superAdminId);
      expect(result.lead.status).toBe('CONVERTED');
      expect(result.lead.convertedMemberId).toBeDefined();
      expect(result.memberProfile.phone).toBe('1234560000');
    });

    it('should fail to convert an already converted lead', async () => {
      const lead = await createLead({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '1234560001',
        email: `jane${Date.now()}@test.com`,
        branchId: mainBranchId,
        source: 'WALK_IN',
        priority: 'MEDIUM',
      }, superAdminId);

      await convertLead(lead.id, superAdminId);
      
      await expect(convertLead(lead.id, superAdminId)).rejects.toThrow(LeadAlreadyConvertedError);
    });
  });

  describe('Status Lifecycle', () => {
    it('should prevent invalid status transitions', async () => {
      const lead = await createLead({
        firstName: 'Test',
        lastName: 'Transition',
        phone: '0000000000',
        branchId: mainBranchId,
        source: 'WALK_IN',
        priority: 'MEDIUM',
      }, superAdminId);

      // Valid transition
      const updated = await changeLeadStatus(lead.id, 'CONTACTED', superAdminId, 'Called');
      expect(updated.status).toBe('CONTACTED');

      // Invalid transition (CONVERTED must go through conversion logic, not raw changeStatus)
      await expect(changeLeadStatus(lead.id, 'CONVERTED', superAdminId)).rejects.toThrow(InvalidLeadTransitionError);
    });
  });
});
