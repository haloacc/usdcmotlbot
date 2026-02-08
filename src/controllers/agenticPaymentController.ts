/**
 * Agentic Payment Controller
 * Orchestrates the full flow: prompt → ACP REQUEST → (merchant) → ACP RESPONSE → normalize → risk → decision → payment
 */

import { Request, Response } from 'express';
import { parsePrompt } from '../services/promptParser';
import { buildACPCreateRequest } from '../services/acpBuilder';
import { merchantSimulateCheckoutResponse } from '../services/merchantSimulator';
import { parseACP } from '../services/acpParser';
import { normalizePayload } from '../services/normalizer';
import { computeRiskScore } from '../services/riskEngine';
import { createPaymentIntent } from '../services/stripeService';
import { paymentProcessor, PaymentProcessor } from '../services/paymentProcessor';
import {
  DelegatePaymentRequest,
  CardPaymentMethod,
  BillingAddress,
  DelegatePaymentSuccessResponse,
  DelegatePaymentErrorResponse
} from '../types';

export interface AgenticPaymentRequest {
  prompt: string; // Natural language prompt
}

export interface AgenticPaymentResponse {
  success: boolean;
  decision: 'approve' | 'challenge' | 'block';
  risk_score: number;
  payment_intent_id?: string;
  acp_create_request: any;
  acp_create_response: any;
  normalized_payload: any;
  checkout_session?: any; // For backwards compatibility
  error?: string;
}

export async function processAgenticPayment(
  req: Request<{}, {}, AgenticPaymentRequest>,
  res: Response<AgenticPaymentResponse>
) {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        decision: 'block',
        risk_score: 0,
        error: 'Missing or invalid prompt field',
        normalized_payload: {},
        acp_create_request: {},
        acp_create_response: {},
      });
    }

    // Step 1: Parse natural language prompt
    const parsedPrompt = parsePrompt(prompt);
    console.log('📝 Parsed prompt:', parsedPrompt);

    // Step 2: Build minimal ACP CREATE REQUEST
    const { itemId, request: acpCreateRequest } = buildACPCreateRequest(parsedPrompt);
    console.log('📤 ACP CREATE REQUEST:', acpCreateRequest);

    // Step 3: Merchant simulates response (in production, this would be a real merchant endpoint)
    const acpCreateResponse = merchantSimulateCheckoutResponse(
      acpCreateRequest,
      parsedPrompt.item_name,
      parsedPrompt.amount_cents,
      parsedPrompt.country,
      parsedPrompt.shipping_speed
    );
    console.log('📥 ACP CREATE RESPONSE:', acpCreateResponse.id);

    // Step 4: Halo receives and parses the merchant's ACP response
    const parsedACP = parseACP(acpCreateResponse);
    console.log('🔍 Halo parsed ACP data:', parsedACP);

    // Step 5: Normalize for internal processing
    const normalizedPayload = normalizePayload(parsedACP);
    console.log('✨ Normalized payload:', normalizedPayload);

    // Step 6: Run risk scoring
    const riskResult = computeRiskScore(normalizedPayload);
    console.log('⚠️ Risk assessment:', riskResult);

    // Step 7: Conditional Stripe integration (only on APPROVE)
    let payment_intent_id: string | undefined;
    if (riskResult.decision === 'approve') {
      const paymentIntent = await createPaymentIntent(normalizedPayload);
      if (paymentIntent) {
        payment_intent_id = paymentIntent.id;
        console.log('💳 Stripe PaymentIntent created:', payment_intent_id);
      }
    }

    // Step 8: Return decision with full ACP visibility
    return res.status(200).json({
      success: true,
      decision: riskResult.decision,
      risk_score: riskResult.risk_score,
      payment_intent_id,
      acp_create_request: acpCreateRequest,
      acp_create_response: acpCreateResponse,
      normalized_payload: normalizedPayload,
      checkout_session: acpCreateResponse, // For backwards compatibility with tests
    });
  } catch (error) {
    console.error('❌ Error processing agentic payment:', error);
    return res.status(500).json({
      success: false,
      decision: 'block',
      risk_score: 0,
      error: error instanceof Error ? error.message : 'Internal server error',
      normalized_payload: {},
      acp_create_request: {},
      acp_create_response: {},
    });
  }
}

/**
 * Complete Payment Flow with Card Details (ACP Schema 3)
 * Full flow: checkout → risk evaluation → delegate payment with card
 */

export interface CompletePaymentRequest {
  prompt: string;
  payment_method: CardPaymentMethod;
  billing_address: BillingAddress;
}

export interface CompletePaymentResponse {
  success: boolean;
  decision: 'approve' | 'challenge' | 'block';
  risk_score: number;
  checkout_session_id: string;
  payment_result?: DelegatePaymentSuccessResponse;
  payment_error?: DelegatePaymentErrorResponse;
  acp_create_request: any;
  acp_create_response: any;
  normalized_payload: any;
  error?: string;
}

export async function processCompletePayment(
  req: Request<{}, {}, CompletePaymentRequest>,
  res: Response<CompletePaymentResponse>
) {
  try {
    const { prompt, payment_method, billing_address } = req.body;

    if (!prompt || !payment_method || !billing_address) {
      return res.status(400).json({
        success: false,
        decision: 'block',
        risk_score: 0,
        checkout_session_id: '',
        error: 'Missing required fields: prompt, payment_method, billing_address',
        normalized_payload: {},
        acp_create_request: {},
        acp_create_response: {},
      });
    }

    // ========== STEP 1: AGENTIC CHECKOUT (Schema 1) ==========
    console.log('🛒 Starting Agentic Checkout...');

    const parsedPrompt = parsePrompt(prompt);
    console.log('📝 Parsed prompt:', parsedPrompt);

    const { itemId, request: acpCreateRequest } = buildACPCreateRequest(parsedPrompt);
    console.log('📤 ACP CREATE REQUEST:', acpCreateRequest);

    const acpCreateResponse = merchantSimulateCheckoutResponse(
      acpCreateRequest,
      parsedPrompt.item_name,
      parsedPrompt.amount_cents,
      parsedPrompt.country,
      parsedPrompt.shipping_speed
    );
    console.log('📥 ACP CREATE RESPONSE (checkout_session_id):', acpCreateResponse.id);

    const parsedACP = parseACP(acpCreateResponse);
    const normalizedPayload = normalizePayload(parsedACP);
    console.log('✨ Normalized payload:', normalizedPayload);

    // ========== STEP 2: HALO RISK EVALUATION ==========
    console.log('⚠️ Running Halo risk evaluation...');
    const riskResult = computeRiskScore(normalizedPayload);
    console.log(`🎯 Risk Decision: ${riskResult.decision} (score: ${riskResult.risk_score})`);

    // If blocked, stop here
    if (riskResult.decision === 'block') {
      return res.status(200).json({
        success: false,
        decision: 'block',
        risk_score: riskResult.risk_score,
        checkout_session_id: acpCreateResponse.id,
        error: 'Transaction blocked by Halo risk engine',
        acp_create_request: acpCreateRequest,
        acp_create_response: acpCreateResponse,
        normalized_payload: normalizedPayload,
      });
    }

    // ========== STEP 3: DELEGATE PAYMENT (Schema 3) ==========
    console.log('💳 Processing delegate payment with card...');

    // Convert Halo risk signals to ACP risk signals
    const riskSignals = PaymentProcessor.convertHaloToRiskSignals(
      riskResult.decision,
      riskResult.risk_score,
      normalizedPayload.halo_normalized.country,
      normalizedPayload.halo_normalized.total_cents
    );

    // Build delegate payment request
    const delegatePaymentRequest: DelegatePaymentRequest = {
      payment_method,
      allowance: {
        reason: 'one_time',
        max_amount: normalizedPayload.halo_normalized.total_cents,
        currency: normalizedPayload.halo_normalized.currency,
        checkout_session_id: acpCreateResponse.id,
        merchant_id: 'halo_merchant',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
      billing_address,
      risk_signals: riskSignals,
      metadata: {
        source: 'chatgpt_checkout',
        prompt: prompt.substring(0, 100), // Store truncated prompt
      },
    };

    // Process payment through Stripe
    const paymentResult = await paymentProcessor.processDelegatePayment(delegatePaymentRequest);

    // Check if payment succeeded
    if ('id' in paymentResult) {
      console.log('✅ Payment succeeded:', paymentResult.id);
      return res.status(200).json({
        success: true,
        decision: riskResult.decision,
        risk_score: riskResult.risk_score,
        checkout_session_id: acpCreateResponse.id,
        payment_result: paymentResult as DelegatePaymentSuccessResponse,
        acp_create_request: acpCreateRequest,
        acp_create_response: acpCreateResponse,
        normalized_payload: normalizedPayload,
      });
    } else {
      console.log('❌ Payment failed:', paymentResult.message);
      return res.status(200).json({
        success: false,
        decision: riskResult.decision,
        risk_score: riskResult.risk_score,
        checkout_session_id: acpCreateResponse.id,
        payment_error: paymentResult as DelegatePaymentErrorResponse,
        error: paymentResult.message,
        acp_create_request: acpCreateRequest,
        acp_create_response: acpCreateResponse,
        normalized_payload: normalizedPayload,
      });
    }

  } catch (error) {
    console.error('❌ Error processing complete payment:', error);
    return res.status(500).json({
      success: false,
      decision: 'block',
      risk_score: 0,
      checkout_session_id: '',
      error: error instanceof Error ? error.message : 'Internal server error',
      normalized_payload: {},
      acp_create_request: {},
      acp_create_response: {},
    });
  }
}

