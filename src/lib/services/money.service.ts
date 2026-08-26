import { Prisma } from '@prisma/client';

export type Money = Prisma.Decimal;

export const MoneyUtil = {
  zero: () => new Prisma.Decimal(0),
  
  from: (value: string | number | Prisma.Decimal): Money => {
    return new Prisma.Decimal(value);
  },
  
  add: (a: Money, b: Money): Money => {
    return a.plus(b);
  },
  
  subtract: (a: Money, b: Money): Money => {
    return a.minus(b);
  },
  
  multiply: (a: Money, b: Money | number): Money => {
    return a.times(b);
  },
  
  percentage: (amount: Money, percent: Money | number): Money => {
    return amount.times(percent).dividedBy(100);
  },
  
  equals: (a: Money, b: Money): boolean => {
    return a.equals(b);
  },
  
  greaterThan: (a: Money, b: Money): boolean => {
    return a.greaterThan(b);
  },
  
  lessThan: (a: Money, b: Money): boolean => {
    return a.lessThan(b);
  },
  
  greaterThanOrEqualTo: (a: Money, b: Money): boolean => {
    return a.greaterThanOrEqualTo(b);
  },
  
  lessThanOrEqualTo: (a: Money, b: Money): boolean => {
    return a.lessThanOrEqualTo(b);
  },
  
  format: (amount: Money): string => {
    return amount.toFixed(2);
  },
  
  round: (amount: Money): Money => {
    return amount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }
};
