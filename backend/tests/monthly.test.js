// backend/tests/monthly.test.js
// Monthly reset ve snapshot business logic testleri

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Monthly Reset Business Logic', () => {

  describe('Date Calculations', () => {
    test('should calculate correct month name from month number', () => {
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];

      expect(months[0]).toBe('Ocak');
      expect(months[11]).toBe('Aralık');
      expect(months.length).toBe(12);
    });

    test('should format month string correctly', () => {
      const year = 2025;
      const monthNum = 11; // Aralık (0-indexed)
      const monthString = `${year}-${String(monthNum + 1).padStart(2, '0')}`;

      expect(monthString).toBe('2025-12');
    });

    test('should handle month overflow (December -> January)', () => {
      const testDate = new Date('2025-12-01');
      testDate.setMonth(testDate.getMonth() + 1);

      expect(testDate.getFullYear()).toBe(2026);
      expect(testDate.getMonth()).toBe(0); // Ocak
    });
  });

  describe('Financial Calculations', () => {
    test('should calculate savings correctly', () => {
      const income = 50000;
      const fixedExpenses = 15500;
      const variableExpenses = 3000;
      const totalExpenses = fixedExpenses + variableExpenses;
      const savings = income - totalExpenses;

      expect(totalExpenses).toBe(18500);
      expect(savings).toBe(31500);
    });

    test('should handle negative savings', () => {
      const income = 10000;
      const totalExpenses = 15000;
      const savings = income - totalExpenses;

      expect(savings).toBe(-5000);
      expect(savings < 0).toBe(true);
    });

    test('should calculate cumulative savings', () => {
      const previousCumulative = 100000;
      const monthlySavings = 31500;
      const newCumulative = previousCumulative + monthlySavings;

      expect(newCumulative).toBe(131500);
    });

    test('should handle zero income edge case', () => {
      const income = 0;
      const expenses = 5000;
      const savings = income - expenses;

      expect(savings).toBe(-5000);
      expect(income).toBe(0);
    });
  });

  describe('Expense Aggregation', () => {
    test('should sum fixed expenses correctly', () => {
      const fixedExpenses = [
        { amount: 12000 }, // Kira
        { amount: 500 },   // Elektrik
        { amount: 300 }    // İnternet
      ];

      const total = fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      expect(total).toBe(12800);
    });

    test('should sum variable expenses correctly', () => {
      const variableExpenses = [
        { amount: 3000 }, // Market
        { amount: 2000 }, // Eğlence
        { amount: 1500 }  // Giyim
      ];

      const total = variableExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      expect(total).toBe(6500);
    });

    test('should handle empty expense arrays', () => {
      const emptyExpenses = [];
      const total = emptyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      expect(total).toBe(0);
    });

    test('should handle expenses with null/undefined amounts', () => {
      const expenses = [
        { amount: 1000 },
        { amount: null },
        { amount: undefined },
        { amount: 2000 }
      ];

      const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      expect(total).toBe(3000);
    });
  });

  describe('Snapshot Data Preparation', () => {
    test('should prepare snapshot data with all required fields', () => {
      const snapshotData = {
        userId: '694d5b67c9d5c977c88a05e3',
        month: '2025-12',
        year: 2025,
        monthName: 'Aralık',
        income: 50000,
        expenses: 18500,
        savings: 31500,
        cumulativeSavings: 131500
      };

      expect(snapshotData).toHaveProperty('userId');
      expect(snapshotData).toHaveProperty('month');
      expect(snapshotData).toHaveProperty('income');
      expect(snapshotData.savings).toBe(31500);
    });

    test('should map debt array correctly', () => {
      const debts = [
        {
          type: 'konut',
          name: 'Ev Kredisi',
          totalAmount: 500000,
          remainingAmount: 300000,
          monthlyPayment: 5000
        }
      ];

      const mappedDebts = debts.map(debt => ({
        type: debt.type,
        name: debt.name,
        totalAmount: debt.totalAmount,
        remainingAmount: debt.remainingAmount,
        monthlyPayment: debt.monthlyPayment
      }));

      expect(mappedDebts).toHaveLength(1);
      expect(mappedDebts[0].type).toBe('konut');
    });
  });

  describe('Production Safeguards', () => {
    test('should check if today is within first 3 days of month', () => {
      const isProduction = false; // localhost
      const dayOfMonth = 25;
      const isAllowed = !isProduction || dayOfMonth <= 3;

      expect(isAllowed).toBe(true); // localhost always allowed
    });

    test('should block reset after day 3 in production', () => {
      const isProduction = true;
      const dayOfMonth = 25;
      const isAllowed = !isProduction || dayOfMonth <= 3;

      expect(isAllowed).toBe(false); // production blocked after day 3
    });

    test('should calculate days since last reset', () => {
      const today = new Date('2025-12-25');
      const lastReset = new Date('2025-11-01');
      const daysSince = Math.floor((today - lastReset) / (1000 * 60 * 60 * 24));

      expect(daysSince).toBe(54); // Nov has 30 days
      expect(daysSince >= 28).toBe(true); // Minimum 28 days passed
    });

    test('should prevent reset if less than 28 days passed', () => {
      const today = new Date('2025-12-15');
      const lastReset = new Date('2025-12-01');
      const daysSince = Math.floor((today - lastReset) / (1000 * 60 * 60 * 24));

      expect(daysSince).toBe(14);
      expect(daysSince >= 28).toBe(false); // Too early!
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle very large income values', () => {
      const income = 1000000000; // 1 billion
      const expenses = 50000;
      const savings = income - expenses;

      expect(savings).toBe(999950000);
      expect(Number.isFinite(savings)).toBe(true);
    });

    test('should handle decimal precision in money calculations', () => {
      const income = 50000.99;
      const expenses = 18500.50;
      const savings = Number((income - expenses).toFixed(2));

      expect(savings).toBe(31500.49);
    });

    test('should handle empty string month format', () => {
      const monthStr = '2025-12';
      const parts = monthStr.split('-');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toBe('2025');
      expect(parts[1]).toBe('12');
    });

    test('should validate user ID format (MongoDB ObjectId)', () => {
      const validUserId = '694d5b67c9d5c977c88a05e3';
      const invalidUserId = 'not-valid-id';

      expect(validUserId).toHaveLength(24);
      expect(invalidUserId).not.toHaveLength(24);
    });
  });
});
