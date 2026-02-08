import { computeRiskScore } from '../../src/services/riskEngine';

describe('Risk Engine', () => {
  test('should approve when score is less than 30', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 2000,
        country: 'US',
        shipping_speed: 'standard',
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.decision).toBe('approve');
    expect(result.risk_score).toBe(0);
  });

  test('should challenge when score is between 30 and 60', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 60000, // > $500 (+35)
        country: 'US',
        shipping_speed: 'standard',
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.decision).toBe('challenge');
    expect(result.risk_score).toBe(35);
  });

  test('should block when score is 60 or more', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 110000, // > $1000 (+50)
        country: 'FR', // non-US (+20)
        shipping_speed: 'express', // express (+10)
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.decision).toBe('block');
    expect(result.risk_score).toBe(80);
  });

  test('should approve for total amount at $50 boundary', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 5000,
        country: 'US',
        shipping_speed: 'standard',
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.decision).toBe('approve');
    expect(result.risk_score).toBe(0);
  });

  test('should add 10 points for amount > $50', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 5001,
        country: 'US',
        shipping_speed: 'standard',
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.risk_score).toBe(10);
  });

  test('should add 20 points for non-US country', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 2000,
        country: 'GB',
        shipping_speed: 'standard',
        currency: 'gbp',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.risk_score).toBe(20);
  });

  test('should add 10 points for express shipping', () => {
    const normalizedPayload = {
      halo_normalized: {
        total_cents: 2000,
        country: 'US',
        shipping_speed: 'express',
        currency: 'usd',
        provider: 'stripe'
      }
    };
    const result = computeRiskScore(normalizedPayload);
    expect(result.risk_score).toBe(10);
  });
});
