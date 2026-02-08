/**
 * X402 (HTTP 402 Payment Required) Adapter
 * Official implementation following Coinbase x402 specification
 * Repository: https://github.com/coinbase/x402
 */

import { IProtocolAdapter, ValidationResult } from '../IProtocolAdapter';
import {
  CanonicalCheckoutRequest,
  CanonicalCheckoutSession,
  CanonicalPaymentRequest,
  CanonicalPaymentResponse,
} from '../canonical-models';
import { ProtocolValidator } from '../protocol-validator';

export interface X402PaymentRequired {
  x402Version: number;
  error?: string;
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: Array<{
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: Record<string, unknown>;
  }>;
  extensions?: Record<string, unknown>;
}

export interface X402PaymentPayload {
  x402Version: number;
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepted: {
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: Record<string, unknown>;
  };
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export class X402Adapter implements IProtocolAdapter {
  public readonly protocolName = 'x402';
  public readonly version = '2.0.0';
  public readonly description = 'Coinbase x402 HTTP Payment Protocol';

  private validator: ProtocolValidator;

  constructor() {
    this.validator = ProtocolValidator.getInstance();
    this.loadSchemas();
  }

  private loadSchemas(): void {
    const x402RequiredSchema = require('../schemas/x402-payment-required.json');
    const x402PayloadSchema = require('../schemas/x402-payment-payload.json');

    this.validator.loadSchema('x402', x402RequiredSchema, 'payment-required');
    this.validator.loadSchema('x402', x402PayloadSchema, 'payment-payload');
  }

  canHandle(raw: any): boolean {
    // x402 detection: has x402Version field
    if (raw?.x402Version === 2) {
      return true;
    }
    // Or has resource + accepts/accepted structure
    if (raw?.resource?.url && (raw?.accepts || raw?.accepted)) {
      return true;
    }
    return false;
  }

  validateRequest(raw: any): ValidationResult {
    const isPaymentPayload = raw?.accepted && raw?.payload;
    const schemaType = isPaymentPayload ? 'payment-payload' : 'payment-required';
    return this.validator.validate('x402', raw, schemaType);
  }

  parseRequest(raw: X402PaymentRequired | X402PaymentPayload): CanonicalCheckoutRequest | CanonicalPaymentRequest {
    const isPaymentPayload = 'accepted' in raw && 'payload' in raw;

    if (isPaymentPayload) {
      return this.parsePaymentPayload(raw as X402PaymentPayload);
    } else {
      return this.parsePaymentRequired(raw as X402PaymentRequired);
    }
  }

  private parsePaymentRequired(raw: X402PaymentRequired): CanonicalCheckoutRequest {
    // Extract resource info as item with amount_cents
    const items = [
      {
        id: 'x402-resource',
        name: raw.resource.description || 'API Resource',
        description: `Access to ${raw.resource.url}`,
        amount_cents: Math.round(parseFloat(raw.accepts[0]?.amount || '0') / 10000), // Convert from atomic units (USDC has 6 decimals)
        quantity: 1,
        currency: this.extractCurrency(raw.accepts[0]),
      },
    ];

    // Map x402 payment methods to AgentCapabilities format
    const agent_capabilities: any = {
      payment_methods: raw.accepts.map((accept) => accept.scheme),
      features: {
        async_completion: true,
      },
    };

    return {
      agent_capabilities,
      items,
      metadata: {
        resourceUrl: raw.resource.url,
        mimeType: raw.resource.mimeType,
        paymentOptions: raw.accepts,
      },
    };
  }

  private parsePaymentPayload(raw: X402PaymentPayload): CanonicalPaymentRequest {
    return {
      session_token: `x402-session-${Date.now()}`,
      payment_method: {
        type: raw.accepted.scheme,
        details: {
          network: raw.accepted.network,
          asset: raw.accepted.asset,
          amount: raw.accepted.amount,
          payload: raw.payload,
        },
      },
      metadata: {
        resourceUrl: raw.resource.url,
        payTo: raw.accepted.payTo,
      },
    };
  }

  validateResponse(canonical: CanonicalCheckoutSession | CanonicalPaymentResponse): ValidationResult {
    // x402 responses are validated during build
    return { valid: true, errors: [] };
  }

  buildResponse(
    canonical: CanonicalCheckoutSession | CanonicalPaymentResponse,
    metadata?: any
  ): X402PaymentRequired | { success: boolean; data?: any } {
    const isPaymentResponse = 'success' in canonical && 'transaction_id' in canonical;

    if (isPaymentResponse) {
      return this.buildPaymentResponse(canonical as CanonicalPaymentResponse);
    } else {
      return this.buildPaymentRequired(canonical as CanonicalCheckoutSession, metadata);
    }
  }

  private buildPaymentRequired(
    canonical: CanonicalCheckoutSession,
    metadata?: any
  ): X402PaymentRequired {
    const resourceUrl = metadata?.resourceUrl || canonical.url || 'https://api.example.com/resource';
    const resourceDescription = canonical.line_items[0]?.name || 'API Resource Access';

    // Build payment requirements for supported methods
    const paymentMethods = canonical.seller_capabilities?.payment_methods || [{ method: 'exact' }];
    const accepts = paymentMethods.map((method: any) => {
      const methodStr = typeof method === 'string' ? method : method.method;
      return {
        scheme: methodStr,
        network: 'eip155:arc', // The Arc Economic OS Blockchain
        asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Arc
        amount: Math.floor((canonical.amount_total || 0) * 10000).toString(), // Convert to atomic units (6 decimals)
        payTo: metadata?.merchantWallet || '0x209693Bc6afc0C5328bA36FaF03C514EF312287C',
        maxTimeoutSeconds: 60,
        extra: {
          name: 'USDC',
          version: '2',
          vision: 'Economic OS Settlement'
        },
      };
    });

    // x402 risk-based extensions
    // For challenge: require wallet signature confirmation
    // For block: reject the payment requirement
    const riskDecision = canonical.halo_risk?.decision || 'approve';
    const riskScore = canonical.halo_risk?.score || 0;

    const extensions: Record<string, unknown> = {
      halo_risk: {
        score: riskScore,
        decision: riskDecision,
      },
    };

    // For challenge scenarios, require additional confirmation
    if (riskDecision === 'challenge') {
      extensions.requires_confirmation = true;
      extensions.confirmation_type = 'wallet_signature'; // x402 equivalent of 3DS
      extensions.message = 'Additional wallet signature required for verification';
    }

    return {
      x402Version: 2,
      error: riskDecision === 'block' 
        ? 'Payment blocked due to risk assessment' 
        : 'Payment required to access this resource',
      resource: {
        url: resourceUrl,
        description: resourceDescription,
        mimeType: metadata?.mimeType || 'application/json',
      },
      accepts: riskDecision === 'block' ? [] : accepts, // Empty accepts = blocked
      extensions,
    };
  }

  private buildPaymentResponse(
    canonical: CanonicalPaymentResponse
  ): { success: boolean; data?: any } {
    return {
      success: canonical.success,
      data: {
        transactionId: canonical.transaction_id,
        status: canonical.status,
        message: canonical.success ? 'Payment verified and settled' : canonical.error_message,
      },
    };
  }

  private extractCurrency(accept: any): string {
    // Extract currency from extra.name or default to USD
    if (accept?.extra?.name) {
      return accept.extra.name;
    }
    // Could also parse from asset address
    return 'USDC';
  }
}
