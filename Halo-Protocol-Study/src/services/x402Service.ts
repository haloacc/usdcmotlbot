/**
 * x402 Service
 * Implements x402 Protocol v2 (HTTP 402 Payment Required)
 * Per official Coinbase x402 specification
 */

import {
  X402PaymentRequired,
  X402PaymentPayload,
  X402PaymentRequirement,
  X402SettlementResponse,
  X402VerifyResponse,
  X402Resource,
} from '../types/protocols';

// ============================================================================
// CONSTANTS
// ============================================================================

// Base Sepolia testnet (CAIP-2 format)
const DEFAULT_NETWORK = 'eip155:84532';
// USDC on Base Sepolia
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
// Demo merchant wallet
const MERCHANT_WALLET = '0x209693Bc6afc0C5328bA36FaF03C514EF312287C';

// ============================================================================
// LEGACY INTERFACE (backwards compatibility)
// ============================================================================

export interface x402Invoice {
  error: string; // "payment_required"
  invoice_id: string;
  amount: number;
  currency: string;
  methods: string[]; // ["lightning", "credit"]
  merchant_name: string;
}

export function simulateX402Invoice(
  item: string,
  amount: number,
  currency: string
): x402Invoice {
  return {
    error: "payment_required",
    invoice_id: `inv_${Math.random().toString(36).substring(2, 10)}`,
    amount: amount,
    currency: currency,
    methods: ["lightning", "usdc", "credit_card"],
    merchant_name: "CyberShop (x402)"
  };
}

import { ParsedACP } from './acpParser';

export function parseX402(invoice: x402Invoice): ParsedACP {
    return {
        total_cents: Math.round(invoice.amount * 100),
        currency: invoice.currency,
        country: 'US',
        payment_provider: 'x402_lightning',
        shipping_speed: 'instant'
    };
}

// ============================================================================
// OFFICIAL x402 v2 IMPLEMENTATION
// ============================================================================

/**
 * Generate x402 PaymentRequired response (official spec)
 */
export function generatePaymentRequired(
  resourceUrl: string,
  amountCents: number,
  description: string = 'API Access',
  options?: {
    mimeType?: string;
    maxTimeoutSeconds?: number;
    scheme?: string;
    network?: string;
    asset?: string;
  }
): X402PaymentRequired {
  // Convert cents to USDC atomic units (6 decimals)
  // $1.00 = 100 cents = 1000000 atomic units
  const atomicAmount = (amountCents * 10000).toString();
  
  return {
    x402Version: 2,
    error: 'Payment required to access this resource',
    resource: {
      url: resourceUrl,
      description,
      mimeType: options?.mimeType || 'application/json',
    },
    accepts: [
      {
        scheme: options?.scheme || 'exact',
        network: options?.network || DEFAULT_NETWORK,
        asset: options?.asset || USDC_CONTRACT,
        amount: atomicAmount,
        payTo: MERCHANT_WALLET,
        maxTimeoutSeconds: options?.maxTimeoutSeconds || 60,
        extra: {
          name: 'USDC',
          version: '2',
        },
      },
    ],
    extensions: {},
  };
}

/**
 * Verify payment payload (per official spec)
 */
export function verifyPaymentPayload(
  payload: X402PaymentPayload,
  requirements: X402PaymentRequirement
): X402VerifyResponse {
  // Verify x402 version
  if (payload.x402Version !== 2) {
    return {
      isValid: false,
      invalidReason: 'Invalid x402 version. Expected 2.',
    };
  }
  
  // Verify accepted payment matches requirements
  if (payload.accepted.network !== requirements.network) {
    return {
      isValid: false,
      invalidReason: `Network mismatch. Expected ${requirements.network}, got ${payload.accepted.network}`,
    };
  }
  
  if (payload.accepted.amount !== requirements.amount) {
    return {
      isValid: false,
      invalidReason: `Amount mismatch. Expected ${requirements.amount}, got ${payload.accepted.amount}`,
    };
  }
  
  // Verify signature exists
  if (!payload.payload.signature) {
    return {
      isValid: false,
      invalidReason: 'Missing payment signature',
    };
  }
  
  // Verify authorization
  if (!payload.payload.authorization) {
    return {
      isValid: false,
      invalidReason: 'Missing payment authorization',
    };
  }
  
  const auth = payload.payload.authorization;
  
  // Verify timing
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(auth.validBefore) < now) {
    return {
      isValid: false,
      invalidReason: 'Payment authorization expired',
    };
  }
  
  if (parseInt(auth.validAfter) > now) {
    return {
      isValid: false,
      invalidReason: 'Payment authorization not yet valid',
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    payer: auth.from,
  };
}

/**
 * Settle payment (simulate blockchain settlement)
 */
export function settlePayment(
  payload: X402PaymentPayload,
  requirements: X402PaymentRequirement
): X402SettlementResponse {
  // First verify
  const verification = verifyPaymentPayload(payload, requirements);
  
  if (!verification.isValid) {
    return {
      success: false,
      transaction: '',
      network: requirements.network,
      errorReason: verification.invalidReason,
    };
  }
  
  // Generate mock transaction hash
  const txHash = `0x${generateRandomHex(64)}`;
  
  return {
    success: true,
    transaction: txHash,
    network: requirements.network,
    payer: verification.payer,
  };
}

/**
 * Create payment payload for testing
 */
export function createTestPaymentPayload(
  requirements: X402PaymentRequirement,
  payerAddress: string = '0x857b06519E91e3A54538791bDbb0E22373e36b66'
): X402PaymentPayload {
  const now = Math.floor(Date.now() / 1000);
  
  return {
    x402Version: 2,
    accepted: requirements,
    payload: {
      signature: `0x${generateRandomHex(130)}`, // 65 bytes
      authorization: {
        from: payerAddress,
        to: requirements.payTo,
        value: requirements.amount,
        validAfter: (now - 60).toString(),
        validBefore: (now + 120).toString(),
        nonce: `0x${generateRandomHex(64)}`,
      },
    },
    extensions: {},
  };
}

/**
 * Generate random hex string
 */
function generateRandomHex(length: number): string {
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const x402Service = {
  generatePaymentRequired,
  verifyPaymentPayload,
  settlePayment,
  createTestPaymentPayload,
  // Legacy
  simulateX402Invoice,
  parseX402,
};
