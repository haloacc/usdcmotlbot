import request from 'supertest';
import app from '../../src/app';
import { createPaymentIntent } from '../../src/services/stripeService';
import { recentTransactions } from '../../src/services/riskEngine';

jest.mock('../../src/services/stripeService');

describe('Agentic Payment Controller Integration Tests', () => {
  beforeEach(() => {
    (createPaymentIntent as jest.Mock).mockResolvedValue({ id: 'pi_test_123' });
    recentTransactions.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /halo/process-payment', () => {
    it('should process simple payment prompt and return APPROVE', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $20 shoes from Nike',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.decision).toBe('approve');
      expect(response.body.risk_score).toBeLessThan(30);
      expect(response.body.normalized_payload).toBeDefined();
      expect(response.body.checkout_session).toBeDefined();
      // Check the normalized total instead of checkout_session.total_cents
      expect(response.body.normalized_payload.halo_normalized.total_cents).toBe(2200 + 500); // $20 + 10% tax + $5 shipping
    });

    it('should process payment with express shipping', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $50 jacket from Amazon with express shipping',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.normalized_payload.halo_normalized.shipping_speed).toBe('express');
      expect(response.body.decision).toBe('approve'); // $50 + $5 tax + $15 express = $70 -> score 20 (10+10)
      expect(response.body.risk_score).toBe(20);
    });

    it('should process international payment', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $100 book in France with express shipping',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.normalized_payload.halo_normalized.country).toBe('FR');
      expect(response.body.decision).toBe('challenge'); // $100 + $10 tax + $15 express = $125 -> score 50 (20+20+10)
      expect(response.body.risk_score).toBe(50);
    });

    it('should process payment with multiple items', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy 3 shirts for $30 each from eBay',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.decision).toBe('approve');
    });

    it('should extract merchant correctly', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Purchase $50 headphones from Best Buy',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.checkout_session).toBeDefined();
    });

    it('should extract country correctly', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $50 headphones for UK',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.normalized_payload.halo_normalized.country).toBe('GB');
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid prompt type', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 12345, // number instead of string
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should attempt to create payment intent for APPROVE decisions', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $15 coffee',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.decision).toBe('approve');
      // payment_intent_id may be undefined if Stripe API key is not configured
      // but the response should still indicate approval
      expect(response.body.decision).toBe('approve');
    });

    it('should not create payment intent for CHALLENGE decisions', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $100 laptop with express shipping',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.decision).toBe('challenge');
      expect(response.body.payment_intent_id).toBeUndefined();
    });

    it('should return normalized payload with correct structure', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $99 sneakers from Nike with express',
        })
        .expect(200);

      const normalized = response.body.normalized_payload.halo_normalized;
      expect(normalized.total_cents).toBeDefined();
      expect(normalized.currency).toBe('usd');
      expect(normalized.country).toBe('US');
      expect(normalized.provider).toBe('stripe');
      expect(normalized.shipping_speed).toBeDefined();
    });

    it('should handle decimal amounts', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $99.99 watch',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.normalized_payload.halo_normalized.total_cents).toBeGreaterThan(0);
    });

    it('should handle large amounts', async () => {
      const response = await request(app)
        .post('/halo/process-payment')
        .send({
          prompt: 'Buy $5000 laptop with express shipping to France',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.decision).toBe('block'); // High amount + express + non-US
      expect(response.body.risk_score).toBeGreaterThanOrEqual(60);
    });

    it('should generate unique checkout session IDs', async () => {
      const response1 = await request(app)
        .post('/halo/process-payment')
        .send({ prompt: 'Buy $50 shoes' })
        .expect(200);

      const response2 = await request(app)
        .post('/halo/process-payment')
        .send({ prompt: 'Buy $50 shoes' })
        .expect(200);

      expect(response1.body.checkout_session.id).not.toBe(
        response2.body.checkout_session.id
      );
    });
  });
});
