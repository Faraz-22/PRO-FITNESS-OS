import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const issueInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().min(5).optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  memberId: z.string().cuid(),
  branchId: z.string().cuid(),
  branchCode: z.string().min(2),
  amount: z.coerce.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  provider: z.string().optional(),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
});

export const processRefundSchema = z.object({
  paymentId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  reason: z.string().min(5),
});

export const createBillingIntentSchema = z.object({
  invoiceId: z.string().cuid().optional(),
  memberId: z.string().cuid(),
  branchId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  idempotencyKey: z.string().min(10)
});
