import request from 'supertest';
import app from '../../src/app';
import { createPaymentIntent } from '../../src/services/stripeService';

jest.mock('../../src/services/stripeService');

describe('PaymentController Integration Tests - Real ACP Payloads', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process a real ACP checkout session and return APPROVE decision', async () => {
    const realAcpPayload = {
      protocol: "ACP",
      payload: {
        id: "cs_a8134a89e1",
        status: "ready_for_payment",
        currency: "usd",
        payment_provider: {
          provider: "stripe",
          supported_payment_methods: ["card"]
        },
        line_items: [
          {
            id: "li_b00944e1d5",
            item: {
              id: "sku_mug_001",
              quantity: 1
            },
            base_amount: 1800,
            discount: 0,
            subtotal: 1800,
            tax: 153,
            total: 1953,
            name: "Coffee Mug"
          }
        ],
        totals: [
          {
            type: "items_base_amount",
            display_text: "Item(s) total",
            amount: 1800
          },
          {
            type: "tax",
            display_text: "Tax",
            amount: 153
          },
          {
            type: "shipping",
            display_text: "Shipping",
            amount: 599
          },
          {
            type: "total",
            display_text: "Total",
            amount: 2552
          }
        ],
        fulfillment_options: [
          {
            type: "shipping",
            id: "ship_econ",
            title: "Economy (5–7 days)",
            total: 599
          }
        ],
        fulfillment_details: {
          address: {
            name: "John Doe",
            line_one: "123 Main St",
            city: "San Francisco",
            state: "CA",
            country: "US",
            postal_code: "94105"
          }
        }
      }
    };

    (createPaymentIntent as jest.Mock).mockResolvedValue({ id: 'pi_test_123' });

    const response = await request(app)
      .post('/halo/process-acp')
      .send(realAcpPayload)
      .expect(200);

    expect(response.body).toHaveProperty('risk_score');
    expect(response.body).toHaveProperty('decision');
    expect(response.body.decision).toBe('approve');
    expect(response.body.normalized_payload).toHaveProperty('halo_normalized');
    expect(response.body.normalized_payload.halo_normalized.total_cents).toBe(2552);
    expect(response.body.normalized_payload.halo_normalized.country).toBe('US');
    expect(response.body.normalized_payload.halo_normalized.shipping_speed).toBe('standard');

    // Approve decision should create payment intent
    expect(createPaymentIntent).toHaveBeenCalledTimes(1);
  });

  it('should process ACP with express shipping and return CHALLENGE decision', async () => {
    const acpPayloadWithExpress = {
      protocol: "ACP",
      payload: {
        id: "cs_express_001",
        status: "ready_for_payment",
        currency: "usd",
        payment_provider: {
          provider: "stripe",
          supported_payment_methods: ["card"]
        },
        line_items: [
          {
            id: "li_001",
            item: {
              id: "sku_001",
              quantity: 2
            },
            base_amount: 10000,
            discount: 0,
            subtotal: 10000,
            tax: 850,
            total: 10850
          }
        ],
        totals: [
          {
            type: "items_base_amount",
            display_text: "Item(s) total",
            amount: 10000
          },
          {
            type: "tax",
            display_text: "Tax",
            amount: 850
          },
          {
            type: "shipping",
            display_text: "Express Shipping",
            amount: 1500
          },
          {
            type: "total",
            display_text: "Total",
            amount: 12350
          }
        ],
        fulfillment_options: [
          {
            type: "shipping",
            id: "ship_exp",
            title: "Express (2–3 days)",
            total: 1500
          }
        ],
        selected_fulfillment_options: [
          {
            type: "shipping",
            shipping: {
              option_id: "ship_exp",
              item_ids: ["li_001"]
            }
          }
        ],
        fulfillment_details: {
          address: {
            name: "Jane Smith",
            line_one: "456 Oak Ave",
            city: "New York",
            state: "NY",
            country: "US",
            postal_code: "10001"
          }
        }
      }
    };

    const response = await request(app)
      .post('/halo/process-acp')
      .send(acpPayloadWithExpress)
      .expect(200);

    expect(response.body.decision).toBe('challenge');
    expect(response.body.normalized_payload.halo_normalized.total_cents).toBe(12350);
    expect(response.body.normalized_payload.halo_normalized.shipping_speed).toBe('express');

    // Challenge decision should NOT create payment intent
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it('should process ACP with international shipping and return BLOCK decision', async () => {
    const intlAcpPayload = {
      protocol: "ACP",
      payload: {
        id: "cs_intl_001",
        status: "ready_for_payment",
        currency: "usd",
        payment_provider: {
          provider: "stripe",
          supported_payment_methods: ["card"]
        },
        line_items: [
          {
            id: "li_intl",
            item: {
              id: "sku_premium",
              quantity: 1
            },
            base_amount: 15000,
            discount: 0,
            subtotal: 15000,
            tax: 0,
            total: 15000
          }
        ],
        totals: [
          {
            type: "items_base_amount",
            display_text: "Item(s) total",
            amount: 15000
          },
          {
            type: "tax",
            display_text: "Tax",
            amount: 0
          },
          {
            type: "shipping",
            display_text: "Express International",
            amount: 3000
          },
          {
            type: "total",
            display_text: "Total",
            amount: 18000
          }
        ],
        fulfillment_options: [
          {
            type: "shipping",
            id: "ship_intl_exp",
            title: "Express International Shipping",
            total: 3000
          }
        ],
        selected_fulfillment_options: [
          {
            type: "shipping",
            shipping: {
              option_id: "ship_intl_exp",
              item_ids: ["li_intl"]
            }
          }
        ],
        fulfillment_details: {
          address: {
            name: "Pierre Dupont",
            line_one: "123 Rue de Paris",
            city: "Paris",
            state: "Île-de-France",
            country: "FR",
            postal_code: "75001"
          }
        }
      }
    };

    const response = await request(app)
      .post('/halo/process-acp')
      .send(intlAcpPayload)
      .expect(200);

    expect(response.body.decision).toBe('challenge');
    expect(response.body.normalized_payload.halo_normalized.country).toBe('FR');
    expect(response.body.normalized_payload.halo_normalized.total_cents).toBe(18000);
    expect(response.body.normalized_payload.halo_normalized.shipping_speed).toBe('express');

    // Block decision should NOT create payment intent
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it('should return 400 error for invalid protocol', async () => {
    const invalidPayload = {
      protocol: "INVALID",
      payload: {
        id: "cs_123",
        status: "ready_for_payment",
        currency: "usd",
        payment_provider: { provider: "stripe", supported_payment_methods: ["card"] },
        line_items: [],
        totals: [],
        fulfillment_options: []
      }
    };

    const response = await request(app)
      .post('/halo/process-acp')
      .send(invalidPayload)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 error for missing required fields', async () => {
    const invalidPayload = {
      protocol: "ACP",
      payload: {
        id: "cs_123"
        // Missing other required fields
      }
    };

    const response = await request(app)
      .post('/halo/process-acp')
      .send(invalidPayload)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 error if totals array missing total entry', async () => {
    const invalidPayload = {
      protocol: "ACP",
      payload: {
        id: "cs_123",
        status: "ready_for_payment",
        currency: "usd",
        payment_provider: { provider: "stripe", supported_payment_methods: ["card"] },
        line_items: [],
        totals: [
          { type: "tax", display_text: "Tax", amount: 100 }
          // Missing type: "total" entry
        ],
        fulfillment_options: []
      }
    };

    const response = await request(app)
      .post('/halo/process-acp')
      .send(invalidPayload)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});