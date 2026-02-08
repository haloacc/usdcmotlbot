import { normalizePayload } from '../../src/services/normalizer';
import { ParsedACP } from '../../src/services/acpParser';

describe('Normalizer Service', () => {
  it('should normalize a valid ACP payload', () => {
    const acpPayload: ParsedACP = {
      total_cents: 8300,
      currency: 'usd',
      country: 'US',
      payment_provider: 'stripe',
      shipping_speed: 'express'
    };

    const expectedNormalizedPayload = {
      halo_normalized: {
        total_cents: 8300,
        currency: 'usd',
        country: 'US',
        provider: 'stripe',
        shipping_speed: 'express'
      }
    };

    const result = normalizePayload(acpPayload);
    expect(result).toEqual(expectedNormalizedPayload);
  });

  it('should handle missing fields gracefully', () => {
    const acpPayload: ParsedACP = {
      total_cents: 5000,
      currency: 'usd',
      country: 'US',
      payment_provider: 'stripe',
      shipping_speed: 'standard'
    };

    const expectedNormalizedPayload = {
      halo_normalized: {
        total_cents: 5000,
        currency: 'usd',
        country: 'US',
        provider: 'stripe',
        shipping_speed: 'standard'
      }
    };

    const result = normalizePayload(acpPayload);
    expect(result).toEqual(expectedNormalizedPayload);
  });
});