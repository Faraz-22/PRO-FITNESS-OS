import { Money, MoneyUtil } from './money.service';

export interface TaxCalculationResult {
  subtotal: Money;
  discountAmount: Money;
  taxableAmount: Money;
  taxAmount: Money;
  totalAmount: Money;
}

export const TaxService = {
  calculateItemLineTotal: (
    quantity: number,
    unitPrice: Money,
    discountAmount: Money,
    taxRate: Money
  ): { lineTotal: Money; taxAmount: Money } => {
    const qtyMoney = MoneyUtil.from(quantity);
    const subtotal = MoneyUtil.multiply(unitPrice, qtyMoney);
    
    // Line discount
    let taxableAmount = MoneyUtil.subtract(subtotal, discountAmount);
    if (MoneyUtil.lessThan(taxableAmount, MoneyUtil.zero())) {
      taxableAmount = MoneyUtil.zero();
    }
    
    // Tax
    const taxAmount = MoneyUtil.round(MoneyUtil.percentage(taxableAmount, taxRate));
    const lineTotal = MoneyUtil.add(taxableAmount, taxAmount);
    
    return { lineTotal, taxAmount };
  },

  calculateInvoiceTotals: (
    items: { lineTotal: Money; taxAmount: Money; discountAmount: Money; unitPrice: Money; quantity: number }[],
    globalDiscountAmount: Money = MoneyUtil.zero()
  ): TaxCalculationResult => {
    let subtotal = MoneyUtil.zero();
    let totalItemDiscount = MoneyUtil.zero();
    let totalItemTax = MoneyUtil.zero();
    
    for (const item of items) {
      const itemGross = MoneyUtil.multiply(item.unitPrice, item.quantity);
      subtotal = MoneyUtil.add(subtotal, itemGross);
      totalItemDiscount = MoneyUtil.add(totalItemDiscount, item.discountAmount);
      totalItemTax = MoneyUtil.add(totalItemTax, item.taxAmount);
    }
    
    const totalDiscount = MoneyUtil.add(totalItemDiscount, globalDiscountAmount);
    let taxableAmount = MoneyUtil.subtract(subtotal, totalDiscount);
    if (MoneyUtil.lessThan(taxableAmount, MoneyUtil.zero())) {
      taxableAmount = MoneyUtil.zero();
    }
    
    // Note: Items already calculate their own tax based on line total.
    // We aggregate item-level tax to the global tax amount.
    // If we apply a global discount, we might need to proportionally adjust tax, but
    // for simplicity, we assume global discount is applied post-tax or we don't recalculate global tax directly unless specified.
    // Here we just add up what items reported.
    const taxAmount = totalItemTax;
    
    // Final total calculation:
    // Subtotal - Discount + Tax
    let totalAmount = MoneyUtil.add(MoneyUtil.subtract(subtotal, totalDiscount), taxAmount);
    if (MoneyUtil.lessThan(totalAmount, MoneyUtil.zero())) {
      totalAmount = MoneyUtil.zero();
    }
    
    return {
      subtotal,
      discountAmount: totalDiscount,
      taxableAmount,
      taxAmount,
      totalAmount
    };
  }
};
