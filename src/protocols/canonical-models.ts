/**
 * Canonical Models
 * 
 * These are re-exports and extensions of the existing types
 * to provide a simpler interface for protocol adapters
 */

// Re-export existing types
export {
  AgentCapabilities,
  SellerCapabilities,
  PaymentMethodDetails,
  ACPCheckoutSession as CanonicalCheckoutSession,
  Item,
  LineItem,
  Total,
  FulfillmentOption,
  FulfillmentDetails,
} from '../types';

import {
  AgentCapabilities,
  SellerCapabilities,
  ACPCheckoutSession,
} from '../types';

/**
 * Simplified types for protocol adapters
 */
export interface CanonicalCheckoutRequest {
  agent_capabilities?: AgentCapabilities;
  seller_capabilities?: SellerCapabilities;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    amount_cents: number;
    description?: string;
    currency?: string;
  }>;
  metadata?: any;
}

export interface CanonicalPaymentRequest {
  session_token: string;
  payment_method: {
    type: string;
    details?: any;
  };
  metadata?: any;
}

export interface CanonicalPaymentResponse {
  success: boolean;
  transaction_id?: string;
  status?: 'succeeded' | 'pending' | 'failed' | 'requires_action';
  amount?: number;
  currency?: string;
  error_message?: string;
  metadata?: any;
}

