import { parsePrompt, ParsedPrompt } from '../../src/services/promptParser';

describe('Prompt Parser Service', () => {
  describe('Amount Extraction', () => {
    it('should extract amount with dollar sign', () => {
      const result = parsePrompt('Buy $100 shoes');
      expect(result.amount_cents).toBe(10000);
    });

    it('should extract amount without dollar sign', () => {
      const result = parsePrompt('Buy 50 shoes');
      expect(result.amount_cents).toBe(5000);
    });

    it('should extract amount with "dollars" text', () => {
      const result = parsePrompt('Buy 75 dollars worth of shoes');
      expect(result.amount_cents).toBe(7500);
    });

    it('should handle decimal amounts', () => {
      const result = parsePrompt('Buy $99.99 shoes');
      expect(result.amount_cents).toBe(9999);
    });

    it('should handle comma-separated amounts', () => {
      const result = parsePrompt('Buy $1,000 shoes');
      expect(result.amount_cents).toBe(100000);
    });
  });

  describe('Item Extraction', () => {
    it('should extract item name', () => {
      const result = parsePrompt('Buy shoes from Nike');
      expect(result.item_name).toContain('shoe');
    });

    it('should extract item with quantity', () => {
      const result = parsePrompt('Buy 5 shirts from Amazon');
      expect(result.quantity).toBe(5);
      expect(result.item_name).toContain('shirt');
    });

    it('should default quantity to 1', () => {
      const result = parsePrompt('Buy a book');
      expect(result.quantity).toBe(1);
    });
  });

  describe('Merchant Extraction', () => {
    it('should extract merchant with "from"', () => {
      const result = parsePrompt('Buy shoes from Nike');
      expect(result.merchant).toBe('Nike');
    });

    it('should extract merchant with "at"', () => {
      const result = parsePrompt('Buy shoes at Amazon');
      expect(result.merchant).toBe('Amazon');
    });

    it('should handle missing merchant', () => {
      const result = parsePrompt('Buy shoes');
      expect(result.merchant).toBeUndefined();
    });
  });

  describe('Shipping Speed Detection', () => {
    it('should detect express shipping', () => {
      const result = parsePrompt('Buy shoes with express shipping');
      expect(result.shipping_speed).toBe('express');
    });

    it('should detect express keyword', () => {
      const result = parsePrompt('Buy shoes express');
      expect(result.shipping_speed).toBe('express');
    });

    it('should detect overnight shipping', () => {
      const result = parsePrompt('Buy shoes overnight');
      expect(result.shipping_speed).toBe('express');
    });

    it('should default to standard shipping', () => {
      const result = parsePrompt('Buy shoes');
      expect(result.shipping_speed).toBe('standard');
    });
  });

  describe('Country Extraction', () => {
    it('should extract US country code', () => {
      const result = parsePrompt('Buy shoes in US');
      expect(result.country).toBe('US');
    });

    it('should extract country code directly', () => {
      const result = parsePrompt('Buy shoes for CA');
      expect(result.country).toBe('CA');
    });

    it('should extract UK and map to GB', () => {
      const result = parsePrompt('Buy shoes in UK');
      expect(result.country).toBe('GB');
    });

    it('should default to US', () => {
      const result = parsePrompt('Buy shoes');
      expect(result.country).toBe('US');
    });
  });

  describe('Full Prompt Examples', () => {
    it('should parse complete prompt 1', () => {
      const result = parsePrompt('Buy $100 shoes from Nike with express shipping');
      expect(result.amount_cents).toBe(10000);
      expect(result.item_name).toContain('shoes');
      expect(result.merchant).toBe('Nike');
      expect(result.shipping_speed).toBe('express');
      expect(result.country).toBe('US');
    });

    it('should parse complete prompt 2', () => {
      const result = parsePrompt('Purchase 2 shirts for $50 each from Amazon to France');
      expect(result.amount_cents).toBe(5000);
      expect(result.quantity).toBe(2);
      expect(result.item_name).toContain('shirts');
      expect(result.merchant).toBe('Amazon');
      expect(result.country).toBe('FR');
    });

    it('should parse complete prompt 3', () => {
      const result = parsePrompt('Order $25.99 book overnight from UK');
      expect(result.amount_cents).toBe(2599);
      expect(result.item_name).toContain('book');
      expect(result.shipping_speed).toBe('express');
      expect(result.country).toBe('GB');
    });
  });
});
