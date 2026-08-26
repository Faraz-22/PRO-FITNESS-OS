import { Prisma } from '@prisma/client';

export class InvalidPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPricingError';
  }
}

/**
 * Calculates the exact final amount for a membership based on base price and an absolute discount amount.
 * Enforces strict Decimal arithmetic to prevent floating-point errors.
 * Ensures: discount >= 0, discount <= basePrice, finalAmount >= 0.
 */
export function calculateFinalPricing(
  basePriceInput: number | string | Prisma.Decimal,
  discountAmountInput: number | string | Prisma.Decimal = 0
): { basePrice: Prisma.Decimal; discountAmount: Prisma.Decimal; finalAmount: Prisma.Decimal } {
  const basePrice = new Prisma.Decimal(basePriceInput);
  const discountAmount = new Prisma.Decimal(discountAmountInput);

  if (basePrice.isNegative()) {
    throw new InvalidPricingError('Base price cannot be negative');
  }

  if (discountAmount.isNegative()) {
    throw new InvalidPricingError('Discount amount cannot be negative');
  }

  if (discountAmount.greaterThan(basePrice)) {
    throw new InvalidPricingError('Discount amount cannot be greater than base price');
  }

  const finalAmount = basePrice.minus(discountAmount);

  return {
    basePrice,
    discountAmount,
    finalAmount,
  };
}
