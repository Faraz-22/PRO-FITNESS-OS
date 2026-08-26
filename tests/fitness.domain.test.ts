import 'dotenv/config';
import { describe, it, expect, vi } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { FitnessGoalService } from '../src/lib/services/fitness-goal.service';
import { MeasurementService } from '../src/lib/services/measurement.service';
import { FitnessAccessService, FitnessAccessError } from '../src/lib/services/fitness-access.service';
import { ProgressPhotoService } from '../src/lib/services/progress-photo.service';

async function seedFitnessEnv() {
  const branch = await prisma.branch.create({ data: { name: 'F-Branch', code: `FB-${Date.now()}` } });
  
  const userStaff = await prisma.user.create({ data: { email: `s-${Date.now()}@t.com`, name: 'Tr', role: 'TRAINER' } });
  const staff = await prisma.staffProfile.create({ data: { userId: userStaff.id, branchId: branch.id, employeeId: `E-${Date.now()}`, firstName: 'T', lastName: 'T', department: 'FITNESS' } });
  const trainer = await prisma.trainerProfile.create({ data: { staffId: staff.id } });

  const userMember = await prisma.user.create({ data: { email: `m-${Date.now()}@t.com`, name: 'Mem', role: 'MEMBER' } });
  const member = await prisma.memberProfile.create({ data: { userId: userMember.id, branchId: branch.id, memberNumber: `M-${Date.now()}`, firstName: 'M', lastName: 'M' } });

  // Assignment
  await prisma.trainerAssignment.create({ data: { trainerId: trainer.id, memberId: member.id, branchId: branch.id } });

  // Second unrelated member
  const userUnrelated = await prisma.user.create({ data: { email: `u-${Date.now()}@t.com`, name: 'Un', role: 'MEMBER' } });
  const unrelated = await prisma.memberProfile.create({ data: { userId: userUnrelated.id, branchId: branch.id, memberNumber: `U-${Date.now()}`, firstName: 'U', lastName: 'U' } });

  return { branch, trainer, member, userMember, unrelated };
}

describe('Phase 2F - Fitness Domain (Goals, Measurements, Access)', () => {
  describe('Authorization Barriers', () => {
    it('1. permits trainer to access assigned member', async () => {
      const env = await seedFitnessEnv();
      const assignment = await FitnessAccessService.requireTrainerMemberAccess(env.trainer.id, env.member.id, env.branch.id);
      expect(assignment.id).toBeDefined();
    });

    it('2. denies trainer access to unassigned member', async () => {
      const env = await seedFitnessEnv();
      await expect(FitnessAccessService.requireTrainerMemberAccess(env.trainer.id, env.unrelated.id, env.branch.id))
        .rejects.toThrow(FitnessAccessError);
    });

    it('3. permits member to access their own records', async () => {
      const env = await seedFitnessEnv();
      const m = await FitnessAccessService.requireMemberFitnessAccess(env.userMember.id, env.member.id);
      expect(m.id).toBe(env.member.id);
    });

    it('4. denies member access to another member', async () => {
      const env = await seedFitnessEnv();
      await expect(FitnessAccessService.requireMemberFitnessAccess(env.userMember.id, env.unrelated.id))
        .rejects.toThrow(FitnessAccessError);
    });
  });

  describe('Measurements & Analytics', () => {
    it('5. accepts valid partial measurement', async () => {
      const env = await seedFitnessEnv();
      const m = await MeasurementService.recordMeasurement(env.member.id, { weight: 80, bodyFatPercentage: 15 }, env.trainer.id);
      expect(Number(m.weight)).toEqual(80); // Prisma Decimal mapping might require Number() cast
      expect(Number(m.bodyFatPercentage)).toEqual(15);
      expect(m.chest).toBeNull();
    });

    it('6. correctly calculates weight change while ignoring missing data', async () => {
      const env = await seedFitnessEnv();
      await MeasurementService.recordMeasurement(env.member.id, { weight: 100 }, env.trainer.id);
      // intermediate missing weight
      await MeasurementService.recordMeasurement(env.member.id, { chest: 105 }, env.trainer.id);
      await MeasurementService.recordMeasurement(env.member.id, { weight: 90 }, env.trainer.id);

      const analytics = await MeasurementService.getWeightChange(env.member.id);
      expect(analytics.change).toBe(-10); // 90 - 100
      expect(analytics.percentage).toBe(-10); // (-10/100)*100
    });
  });

  describe('Goals', () => {
    it('7. creates and completes a goal with historical dates supported', async () => {
      const env = await seedFitnessEnv();
      const goal = await FitnessGoalService.createGoal(env.member.id, { title: 'Lose 5kg', goalType: 'WEIGHT_LOSS' });
      expect(goal.status).toBe('ACTIVE');

      const completed = await FitnessGoalService.completeGoal(goal.id);
      expect(completed.status).toBe('ACHIEVED');
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('Progress Photos', () => {
    it('8. enforces privacy defaults', async () => {
      const env = await seedFitnessEnv();
      const photo = await ProgressPhotoService.recordPhoto(env.member.id, env.userMember.id, 'key1', 'FRONT', 'PRIVATE');
      
      const canTrainerSee = FitnessAccessService.canViewProgressPhoto(photo, 'TRAINER');
      expect(canTrainerSee).toBe(true);

      const canPublicSee = FitnessAccessService.canViewProgressPhoto(photo, 'PUBLIC');
      expect(canPublicSee).toBe(false);
    });
  });
});
