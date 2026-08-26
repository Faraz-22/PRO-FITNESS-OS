import { z } from 'zod';

export const measurementSchema = z.object({
  weight: z.number().positive('Weight must be positive').nullable().optional(),
  weightUnit: z.enum(['KG', 'LBS']).default('KG'),
  bodyFatPercentage: z.number().min(0).max(100, 'Body fat must be between 0 and 100').nullable().optional(),
  bmi: z.number().positive().nullable().optional(),
  chest: z.number().positive().nullable().optional(),
  waist: z.number().positive().nullable().optional(),
  hips: z.number().positive().nullable().optional(),
  leftArm: z.number().positive().nullable().optional(),
  rightArm: z.number().positive().nullable().optional(),
  leftThigh: z.number().positive().nullable().optional(),
  rightThigh: z.number().positive().nullable().optional(),
  lengthUnit: z.enum(['CM', 'INCH']).default('CM'),
  notes: z.string().nullable().optional()
}).refine(data => 
  data.weight != null || 
  data.bodyFatPercentage != null || 
  data.chest != null || 
  data.waist != null || 
  data.hips != null || 
  data.leftArm != null || 
  data.rightArm != null || 
  data.leftThigh != null || 
  data.rightThigh != null, 
{
  message: "At least one measurement field must be provided."
});

export const fitnessGoalSchema = z.object({
  title: z.string().min(2),
  description: z.string().nullable().optional(),
  goalType: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'BODY_RECOMPOSITION', 'FLEXIBILITY', 'GENERAL_FITNESS', 'CUSTOM']),
  targetValue: z.number().nullable().optional(),
  targetUnit: z.string().nullable().optional(),
  targetDate: z.date().nullable().optional(), // Can be historical or future
});

export const workoutSetSchema = z.object({
  setNumber: z.number().int().positive(),
  repsCompleted: z.number().int().nonnegative().nullable().optional(),
  weightUsed: z.number().nonnegative().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  distance: z.number().nonnegative().nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  completed: z.boolean().default(false),
  notes: z.string().nullable().optional()
});

const RESERVED_ALIASES = ['admin', 'staff', 'member', 'api', 'login', 'signup', 'dashboard', 'portfolio'];

export const portfolioAliasSchema = z.string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9-]+$/, 'Alias can only contain lowercase letters, numbers, and hyphens')
  .refine(val => !RESERVED_ALIASES.includes(val), { message: "This alias is reserved and cannot be used." });
