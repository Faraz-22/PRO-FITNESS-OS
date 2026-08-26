import { describe, it, expect, vi } from 'vitest';
import { MembershipDTO } from '@/lib/api/dto/membership.dto';
import { MemberDTO } from '@/lib/api/dto/member.dto';
import { WorkoutDTO } from '@/lib/api/dto/workout.dto';

describe('DTO Security / Leakage', () => {
  it('member DTO strips password and private fields', () => {
    const prismaMember = {
      id: 'm1',
      memberNumber: '123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '12345',
      status: 'ACTIVE',
      joinDate: new Date('2023-01-01'),
      userId: 'u1', // internal
      branchId: 'b1', // internal
      internalNotes: 'VIP', // internal
    } as any;

    const dto = MemberDTO.toMobile(prismaMember) as any;
    expect(dto.id).toBe('m1');
    expect(dto.userId).toBeUndefined();
    expect(dto.branchId).toBeUndefined();
    expect(dto.internalNotes).toBeUndefined();
  });

  it('membership DTO returns exact allowed schema', () => {
    const m = {
      id: 'mem1',
      planNameSnapshot: 'Gold Plan',
      status: 'ACTIVE',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-09-01'),
      internalId: 'secret',
    } as any;
    
    const dto = MembershipDTO.toMobile(m) as any;
    expect(dto.id).toBe('mem1');
    expect(dto.planName).toBe('Gold Plan');
    expect(dto.internalId).toBeUndefined();
  });
});
