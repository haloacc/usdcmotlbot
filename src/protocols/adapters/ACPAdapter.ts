/**
 * ACP (Agentic Checkout Protocol) Adapter
 * Official implementation following OpenAI/Stripe ACP specification
 */

import { IProtocolAdapter, ValidationResult } from '../IProtocolAdapter';
import { CanonicalCheckoutRequest, CanonicalCheckoutSession, CanonicalPaymentRequest, CanonicalPaymentResponse } from '../canonical-models';
import { ProtocolValidator } from '../protocol-validator';
import {
  AgentCapabilities,
  SellerCapabilities,
  ACPCheckoutSession,
  DelegatePaymentRequest,
  DelegatePaymentSuccessResponse,
} from '../../types';
import {
  getDefaultAgentCapabilities,
  generateSellerCapabilities,
} from '../../services/capabilityNegotiator';

export class ACPAdapter implements IProtocolAdapter {
  public readonly protocolName = 'acp';
  public readonly version = '2026-01-16';
  public readonly description = 'OpenAI/Stripe Agentic Checkout Protocol';

  private validator: ProtocolValidator;

  constructor() {
    this.validator = ProtocolValidator.getInstance();
    this.loadSchemas();
  }

  private loadSchemas(): void {
    try {
      const acpCheckoutSchema = require('../schemas/schema.agentic_checkout.json');
      const acpDelegateSchema = require('../schemas/schema.delegate_payment_schema.json');
      this.validator.loadSchema('acp', acpCheckoutSchema, 'checkout-request');
      this.validator.loadSchema('acp', acpDelegateSchema, 'payment-request');
    } catch (error) {
      console.warn('[ACPAdapter] Failed to load schemas:', error);
    }
  }

  canHandle(raw: any): boolean {
    return !!raw?.agent_capabilities || !!raw?.seller_capabilities || !!raw?.payment_method;
  }

  validateRequest(raw: any): ValidationResult {
    // Determine schema type
    const isPaymentRequest = raw?.payment_method && raw?.allowance;
    const schemaType = isPaymentRequest ? 'payment-request' : 'checkout-request';
    return this.validator.validate('acp', raw, schemaType);
  }

  parseRequest(raw: any): CanonicalCheckoutRequest | CanonicalPaymentRequest {
    const isPaymentRequest = raw?.payment_method && raw?.allowance;
    
    if (isPaymentRequest) {
      // Schema 3: Delegate Payment
      return {
        session_token: raw.allowance?.checkout_session_id || '',
        payment_method: raw.payment_method,
        metadata: raw.metadata,
      };
    } else {
      // Schema 2: Capability Negotiation
      const items = raw.items || [];
      return {
        agent_capabilities: raw.agent_capabilities || getDefaultAgentCapabilities(),
        seller_capabilities: raw.seller_capabilities,
        items: items.map((item: any) => ({
          id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || 'Item',
          quantity: item.quantity || 1,
          amount_cents: item.amount_cents || item.price * 100 || 0,
          description: item.description,
          currency: item.currency || 'USD',
        })),
        metadata: raw.metadata,
      };
    }
  }

  validateResponse(canonical: CanonicalCheckoutSession | CanonicalPaymentResponse): ValidationResult {
    return { valid: true, errors: [] };
  }

  buildResponse(
    canonical: CanonicalCheckoutSession | CanonicalPaymentResponse,
    metadata?: any
  ): ACPCheckoutSession | DelegatePaymentSuccessResponse {
    const isPaymentResponse = 'success' in canonical;
    
    if (isPaymentResponse) {
      const paymentResp = canonical as CanonicalPaymentResponse;
      return {
        id: paymentResp.transaction_id || `txn_${Date.now()}`,
        created: new Date().toISOString(),
        metadata: paymentResp.metadata || {},
      } as DelegatePaymentSuccessResponse;
    } else {
      // Return ACPCheckoutSession
      const session = canonical as CanonicalCheckoutSession;
      return session;
    }
  }
}
