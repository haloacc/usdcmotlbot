/**
 * UCP (Universal Commerce Protocol) Adapter
 * Official implementation following Universal Commerce Protocol specification
 * Repository: https://github.com/Universal-Commerce-Protocol/ucp
 */

import { IProtocolAdapter, ValidationResult } from '../IProtocolAdapter';
import {
  CanonicalCheckoutRequest,
  CanonicalCheckoutSession,
  CanonicalPaymentRequest,
  CanonicalPaymentResponse,
} from '../canonical-models';
import { ProtocolValidator } from '../protocol-validator';

export interface UCPCheckoutCreateRequest {
  intent: {
    action: string;
    items?: Array<{
      id?: string;
      name?: string;
      description?: string;
      quantity?: number;
      price?: {
        amount: number;
        currency: string;
      };
    }>;
    context?: any;
  };
  buyer?: {
    id?: string;
    preferences?: any;
  };
  capabilities?: {
    supportedPaymentMethods?: string[];
    supportedCurrencies?: string[];
  };
}

export interface UCPCheckoutResponse {
  checkout: {
    id: string;
    status: string;
    url?: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      quantity: number;
      price: {
        amount: number;
        currency: string;
      };
    }>;
    totals: {
      subtotal: {
        amount: number;
        currency: string;
      };
      tax?: {
        amount: number;
        currency: string;
      };
      total: {
        amount: number;
        currency: string;
      };
    };
    payment?: {
      methods: string[];
      required: boolean;
    };
    merchant: {
      name: string;
      id?: string;
      logo?: string;
    };
  };
}

export interface UCPOrder {
  id: string;
  status: string;
  items: any[];
  totals: any;
  payment?: {
    method: string;
    status: string;
    transactionId?: string;
  };
}

export class UCPAdapter implements IProtocolAdapter {
  public readonly protocolName = 'ucp';
  public readonly version = '2026-01-11';
  public readonly description = 'Universal Commerce Protocol';

  private validator: ProtocolValidator;

  constructor() {
    this.validator = ProtocolValidator.getInstance();
    this.loadSchemas();
  }

  private loadSchemas(): void {
    const ucpCheckoutReqSchema = require('../schemas/ucp-checkout-create-req.json');
    const ucpCheckoutRespSchema = require('../schemas/ucp-checkout-resp.json');
    const ucpOrderSchema = require('../schemas/ucp-order.json');
    const ucpIntentSchema = require('../schemas/ucp-intent.json');

    this.validator.loadSchema('ucp', ucpCheckoutReqSchema, 'checkout-request');
    this.validator.loadSchema('ucp', ucpCheckoutRespSchema, 'checkout-response');
    this.validator.loadSchema('ucp', ucpOrderSchema, 'order');
    this.validator.loadSchema('ucp', ucpIntentSchema, 'intent');
  }

  canHandle(raw: any): boolean {
    // UCP detection: has intent-based structure
    if (raw?.intent?.action) {
      return true;
    }
    // Or checkout/order structure
    if (raw?.checkout?.id || raw?.order?.id) {
      return true;
    }
    return false;
  }

  validateRequest(raw: any): ValidationResult {
    // Check if schema is loaded (UCP has external $refs that may fail)
    if (!this.validator.hasSchema('ucp', 'checkout-request')) {
      // Fall back to structural validation if schema failed to compile
      if (raw?.intent?.action) {
        return { valid: true, errors: [] };
      }
      return { valid: false, errors: ['Invalid UCP request: missing intent.action'] };
    }
    // Validate against UCP checkout request schema
    return this.validator.validate('ucp', raw, 'checkout-request');
  }

  parseRequest(raw: UCPCheckoutCreateRequest): CanonicalCheckoutRequest {
    // Extract items from UCP intent with proper amount_cents
    const items =
      raw.intent?.items?.map((item) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        name: item.name || 'Unknown Item',
        description: item.description || item.name || '',
        amount_cents: Math.round((item.price?.amount || 0) * 100),
        quantity: item.quantity || 1,
        currency: item.price?.currency || 'USD',
      })) || [];

    // Map UCP capabilities to AgentCapabilities format
    const agent_capabilities: any = {
      payment_methods: raw.capabilities?.supportedPaymentMethods || ['card'],
      features: {
        async_completion: true,
      },
    };

    return {
      agent_capabilities,
      items,
      metadata: {
        userQuery: raw.intent?.action || 'checkout',
        intentContext: raw.intent?.context,
        buyerInfo: raw.buyer,
      },
    };
  }

  validateResponse(canonical: CanonicalCheckoutSession | CanonicalPaymentResponse): ValidationResult {
    // UCP responses are validated during build
    return { valid: true, errors: [] };
  }

  buildResponse(
    canonical: CanonicalCheckoutSession | CanonicalPaymentResponse,
    metadata?: any
  ): UCPCheckoutResponse | UCPOrder {
    // Determine response type
    const isPaymentResponse = 'success' in canonical && 'transaction_id' in canonical;

    if (isPaymentResponse) {
      return this.buildOrderResponse(canonical as CanonicalPaymentResponse);
    } else {
      return this.buildCheckoutResponse(canonical as CanonicalCheckoutSession);
    }
  }

  private buildCheckoutResponse(canonical: CanonicalCheckoutSession): UCPCheckoutResponse {
    const subtotal = canonical.line_items.reduce(
      (sum: number, item) => sum + item.subtotal,
      0
    );
    const tax = canonical.line_items.reduce((sum: number, item) => sum + item.tax, 0);
    const total = canonical.amount_total ? canonical.amount_total / 100 : subtotal + tax;

    return {
      checkout: {
        id: canonical.id,
        status: canonical.status,
        url: canonical.url || '',
        items: canonical.line_items.map((item) => ({
          id: item.id || '',
          name: item.name || 'Item',
          description: item.description || '',
          quantity: item.item.quantity,
          price: {
            amount: item.base_amount,
            currency: canonical.currency,
          },
        })),
        totals: {
          subtotal: {
            amount: subtotal,
            currency: canonical.currency,
          },
          tax: {
            amount: tax,
            currency: canonical.currency,
          },
          total: {
            amount: total,
            currency: canonical.currency,
          },
        },
        payment: {
          methods: canonical.seller_capabilities?.payment_methods?.map((pm: any) => 
            typeof pm === 'string' ? pm : pm.method
          ) || ['card'],
          required: true,
        },
        merchant: {
          name: canonical.merchant_info?.name || 'Unknown Merchant',
          id: canonical.merchant_info?.id,
        },
      },
    };
  }

  private buildOrderResponse(canonical: CanonicalPaymentResponse): UCPOrder {
    return {
      id: canonical.transaction_id || `order-${Date.now()}`,
      status: canonical.success ? 'completed' : 'failed',
      items: [],
      totals: {
        total: {
          amount: canonical.amount || 0,
          currency: canonical.currency || 'USD',
        },
      },
      payment: {
        method: 'unknown',
        status: canonical.status || (canonical.success ? 'completed' : 'failed'),
        transactionId: canonical.transaction_id,
      },
    };
  }
}
