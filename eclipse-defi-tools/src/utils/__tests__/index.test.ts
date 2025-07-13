import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  formatTokenAmount,
  formatPrice,
  formatPercentage,
  calculatePriceImpact,
  calculateAPY,
  calculateImpermanentLoss,
  validateAmount,
} from '../index';

describe('Utility Functions', () => {
  describe('formatAddress', () => {
    it('should format wallet address correctly', () => {
      const address = '7VfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';
      expect(formatAddress(address)).toBe('7VfC...voxs');
    });

    it('should handle short addresses', () => {
      const address = '123456';
      expect(formatAddress(address)).toBe('1234...3456');
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amount with symbol', () => {
      const token = { symbol: 'SOL', decimals: 9 };
      expect(formatTokenAmount(1.234567, token as any)).toBe('1.235 SOL');
    });

    it('should handle zero amount', () => {
      const token = { symbol: 'USDC', decimals: 6 };
      expect(formatTokenAmount(0, token as any)).toBe('0 USDC');
    });
  });

  describe('formatPrice', () => {
    it('should format USD price correctly', () => {
      expect(formatPrice(1234.56)).toBe('$1,234.56');
      expect(formatPrice(0.123456)).toBe('$0.1235');
      expect(formatPrice(0.00123)).toBe('$0.00123');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with plus sign for positive values', () => {
      expect(formatPercentage(5.67)).toBe('+5.67%');
      expect(formatPercentage(-3.45)).toBe('-3.45%');
      expect(formatPercentage(0)).toBe('0.00%');
    });
  });

  describe('calculatePriceImpact', () => {
    it('should calculate price impact correctly', () => {
      expect(calculatePriceImpact(100, 95)).toBe(5);
      expect(calculatePriceImpact(100, 105)).toBe(-5);
    });

    it('should handle edge cases', () => {
      expect(calculatePriceImpact(100, 0)).toBe(100);
      expect(calculatePriceImpact(0, 100)).toBe(0);
    });
  });

  describe('calculateAPY', () => {
    it('should calculate APY from APR correctly', () => {
      // 10% APR compounded daily for 1 year
      const apy = calculateAPY(0.1, 365, 1);
      expect(apy).toBeCloseTo(0.10516, 4);
    });

    it('should handle monthly compounding', () => {
      const apy = calculateAPY(0.12, 12, 1);
      expect(apy).toBeCloseTo(0.12683, 4);
    });
  });

  describe('calculateImpermanentLoss', () => {
    it('should calculate IL correctly', () => {
      // Price doubles
      const il = calculateImpermanentLoss(2);
      expect(il).toBeCloseTo(5.72, 2);
    });

    it('should return 0 when price ratio is 1', () => {
      expect(calculateImpermanentLoss(1)).toBe(0);
    });
  });

  describe('validateAmount', () => {
    it('should validate valid amounts', () => {
      expect(validateAmount('123.45')).toBe(true);
      expect(validateAmount('0.001')).toBe(true);
      expect(validateAmount('1000000')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('')).toBe(false);
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount('-10')).toBe(false);
      expect(validateAmount('0')).toBe(false);
    });
  });
});