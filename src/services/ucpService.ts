/**
 * UCP (Universal Checkout Protocol) Bridge Service
 * Translates between Google UCP intents and OpenAI ACP sessions.
 */

import { ParsedPrompt } from './promptParser';
import { ACPCheckoutSession, Decision } from '../types';

// ==========================================
// UCP TYPE DEFINITIONS
// ==========================================

export interface UCPIntent {
  protocol: 'UCP';
  intent: {
    action: 'buy' | 'pay' | 'checkout';
    params: {
      item: string;
      amount: number; // in major units (e.g., Dollars)
      currency: string;
      merchant?: string;
      quantity?: number;
      shipping_speed?: 'standard' | 'express';
      country?: string;
    };
  };
}

export interface UCPResponse {
  protocol: 'UCP';
  status: 'success' | 'failure';
  decision: 'approve' | 'challenge' | 'block';
  data: {
    risk_score: number;
    total_charged: number;
    currency: string;
    merchant_session_id?: string;
    message?: string;
    acp_trace?: {
        request: any;
        response: any;
    };
    x402_trace?: {
        request: any;
        response: any;
    };
    translation_logs?: string[];
  };
}

// ==========================================
// BRIDGE LOGIC
// ==========================================

/**
 * Translates UCP Intent -> Halo Internal Parsed Prompt
 * (which is then used to build ACP Request)
 */
export function translateUCPtoHalo(ucp: UCPIntent): ParsedPrompt {
  const params = ucp.intent.params;

  return {
    item_name: params.item,
    amount_cents: Math.round(params.amount * 100),
    currency: params.currency || 'USD',
    merchant: params.merchant,
    quantity: params.quantity || 1,
    shipping_speed: params.shipping_speed || 'standard',
    country: params.country || 'US',
  } as ParsedPrompt; // Casting because ParsedPrompt strictly expects specific shipping strings, verifying below
}

/**
 * Translates Halo Decision & ACP Session -> UCP Response
 */
export function translateHaloToUCP(
  decision: Decision, 
  acpSession: ACPCheckoutSession | any, // allow any for x402 session/invoice
  acpCreateRequest?: any,
  x402Request?: any,
  translationLogs: string[] = []
): UCPResponse {
  
  const response: UCPResponse = {
    protocol: 'UCP',
    status: decision.decision === 'block' ? 'failure' : 'success',
    decision: decision.decision,
    data: {
      risk_score: decision.risk_score,
      total_charged: decision.normalized_payload.halo_normalized.total_cents / 100, // convert back to major units
      currency: decision.normalized_payload.halo_normalized.currency,
      merchant_session_id: acpSession.id || acpSession.invoice_id,
      message: `Transaction ${decision.decision}ed by Halo Risk Engine`,
      translation_logs: translationLogs
    }
  };

  if (acpCreateRequest) {
      response.data.acp_trace = {
          request: acpCreateRequest,
          response: acpSession
      };
  }

  if (x402Request) {
      response.data.x402_trace = {
          request: x402Request,
          response: acpSession
      };
  }

  return response;
}
