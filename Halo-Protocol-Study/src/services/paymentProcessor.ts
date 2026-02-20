import Stripe from 'stripe';
import { circleArcService } from './circle/CircleService';
import {
  DelegatePaymentRequest,
  DelegatePaymentSuccessResponse,
  DelegatePaymentErrorResponse,
  RiskSignal
} from '../types';

const MOCK_MODE = false; // Disable mock mode for final production readiness review
// const MOCK_MODE = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.length < 20;

const stripe = MOCK_MODE ? null : new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

console.log(`💳 Payment Processor Mode: ${MOCK_MODE ? 'MOCK (no real charges)' : 'LIVE (Stripe API)'}`);

export class PaymentProcessor {
  /**
   * Process delegate payment request following ACP Schema 3
   * 
   * Steps:
   * 1. Validate allowance limits
   * 2. Check for Circle Arc Economic Transition preference
   * 3. Tokenize card with Stripe OR Execute USDC Transition via Circle Arc
   * 4. Create payment intent with risk signals as metadata
   * 5. Confirm payment
   * 6. Return success response or error
   */
  async processDelegatePayment(
    request: DelegatePaymentRequest
  ): Promise<DelegatePaymentSuccessResponse | DelegatePaymentErrorResponse> {
    try {
      // Step 1: Validate allowance expiration
      const expiresAt = new Date(request.allowance.expires_at);
      if (expiresAt < new Date()) {
        return {
          type: 'invalid_request',
          code: 'invalid_card',
          message: 'Payment allowance has expired',
          param: 'allowance.expires_at'
        };
      }

      // Step 2: Validate amount doesn't exceed allowance
      const totalAmount = request.allowance.max_amount;
      if (totalAmount <= 0) {
        return {
          type: 'invalid_request',
          code: 'invalid_card',
          message: 'Invalid payment amount',
          param: 'allowance.max_amount'
        };
      }

      // Step 3: Check if risk signals indicate blocking
      const blockingSignal = request.risk_signals.find(
        signal => signal.action === 'block' && signal.score >= 70
      );
      if (blockingSignal) {
        return {
          type: 'payment_failed',
          code: 'card_declined',
          message: `Payment blocked due to risk: ${blockingSignal.type}`,
        };
      }

      // NEW: Circle Arc Economic OS Settlement (USDC Vision)
      const settlementMethod = request.metadata?.settlement_method || 'card';
      if (settlementMethod === 'usdc' || settlementMethod === 'arc') {
        console.log('🌀 [HALO] Routing to Circle Arc Economic OS Transition');
        
        const destinationAddress = request.metadata?.merchant_wallet || '0x209693Bc6afc0C5328bA36FaF03C514EF312287C';
        const sourceWalletId = request.metadata?.agent_wallet_id || 'default_arc_agent_wallet';
        
        const arcTransition = await circleArcService.executeEconomicTransition(
          sourceWalletId,
          destinationAddress,
          totalAmount / 100 // Convert cents to USDC dollars
        );

        if (arcTransition.status === 'settled') {
          return {
            id: `arc_${arcTransition.id}`,
            created: new Date().toISOString(),
            metadata: {
              source: 'arc_economic_os_transition',
              merchant_id: request.allowance.merchant_id,
              idempotency_key: arcTransition.id,
              tx_hash: arcTransition.txHash,
              blockchain: 'arc_chain',
              settlement: 'usdc',
              cctp_bridged: 'true'
            },
          };
        }
      }

      // MOCK MODE: Simulate payment without Stripe
      if (MOCK_MODE) {
        console.log('🧪 MOCK MODE: Simulating payment (no real charge)');

        // Simulate declined card for testing
        if (request.payment_method.number === '4000000000000002') {
          return {
            type: 'payment_failed',
            code: 'card_declined',
            message: 'Card was declined',
          };
        }

        // Simulate successful payment
        const mockPaymentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return {
          id: `vt_${mockPaymentId}`,
          created: new Date().toISOString(),
          metadata: {
            source: 'agent_checkout',
            merchant_id: request.allowance.merchant_id,
            idempotency_key: mockPaymentId,
          },
        };
      }

      // REAL STRIPE MODE
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      let paymentMethodId: string;

      // Step 4: Check if we have an existing Stripe PaymentMethod ID
      if (request.payment_method.metadata?.stripe_payment_method_id) {
        // Use existing saved payment method
        paymentMethodId = request.payment_method.metadata.stripe_payment_method_id;
        console.log(`💳 Using existing Stripe PaymentMethod: ${paymentMethodId}`);
      } else {
        // Step 4b: Create new payment method from card number
        // Map test card numbers to their corresponding tokens
        const cardTokenMap: Record<string, string> = {
          '4242424242424242': 'tok_visa',           // Visa - Always succeeds
          '4000000000000002': 'tok_chargeDeclined', // Card declined
          '4000000000009995': 'tok_chargeDeclinedInsufficientFunds', // Insufficient funds
        };

        const tokenId = cardTokenMap[request.payment_method.number];

        if (!tokenId) {
          return {
            type: 'invalid_request',
            code: 'invalid_card',
            message: `Test card ${request.payment_method.number} not supported. Use 4242424242424242 for success or 4000000000000002 for declined.`,
            param: 'payment_method.number'
          };
        }

        // Step 5: Create payment method from pre-made token
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: tokenId,
          },
          billing_details: {
            name: request.billing_address.name,
            address: {
              line1: request.billing_address.line_one,
              line2: request.billing_address.line_two || undefined,
              city: request.billing_address.city,
              state: request.billing_address.state,
              country: request.billing_address.country,
              postal_code: request.billing_address.postal_code,
            },
          },
        });
        paymentMethodId = paymentMethod.id;
      }

      // Step 6: Get customer ID from payment method if available
      let customerId: string | undefined;
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        customerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
      } catch (err) {
        console.warn('[PaymentProcessor] Could not retrieve customer from PaymentMethod');
      }

      // Step 7: Create payment intent with risk metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount, // Amount in cents
        currency: request.allowance.currency,
        payment_method: paymentMethodId,
        customer: customerId, // Required for reusing payment methods
        confirm: true,
        metadata: {
          checkout_session_id: request.allowance.checkout_session_id,
          merchant_id: request.allowance.merchant_id,
          source: 'agentic_commerce_protocol',
          risk_score: this.calculateOverallRiskScore(request.risk_signals).toString(),
          ...request.metadata,
        },
        description: `ACP Payment for session ${request.allowance.checkout_session_id}`,
      });

      // Step 8: Check payment status
      if (paymentIntent.status === 'succeeded') {
        return {
          id: `vt_${paymentIntent.id}`,
          created: new Date().toISOString(),
          metadata: {
            source: 'agent_checkout',
            merchant_id: request.allowance.merchant_id,
            idempotency_key: paymentIntent.id,
          },
        };
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication required
        return {
          type: 'invalid_request',
          code: 'card_declined',
          message: 'Payment requires additional authentication (3DS)',
        };
      } else {
        return {
          type: 'payment_failed',
          code: 'card_declined',
          message: `Payment failed with status: ${paymentIntent.status}`,
        };
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);

      // Handle Stripe-specific errors
      if (error.type === 'StripeCardError') {
        return {
          type: 'invalid_request',
          code: 'invalid_card',
          message: error.message || 'Invalid card details provided',
          param: 'payment_method.number'
        };
      } else if (error.type === 'StripeRateLimitError') {
        return {
          type: 'rate_limit_exceeded',
          code: 'too_many_requests',
          message: 'Too many requests, please retry later'
        };
      } else {
        return {
          type: 'payment_failed',
          code: 'card_declined',
          message: error.message || 'Payment processing failed'
        };
      }
    }
  }

  /**
   * Calculate overall risk score from risk signals
   */
  private calculateOverallRiskScore(signals: RiskSignal[]): number {
    if (signals.length === 0) return 0;

    // Weighted average of risk scores
    const totalScore = signals.reduce((sum, signal) => sum + signal.score, 0);
    return Math.round(totalScore / signals.length);
  }

  /**
   * Convert Halo decision to risk signals for ACP
   */
  static convertHaloToRiskSignals(
    decision: string,
    riskScore: number,
    country?: string,
    amount?: number
  ): RiskSignal[] {
    const signals: RiskSignal[] = [];

    // Overall risk signal
    if (riskScore > 0) {
      signals.push({
        type: riskScore >= 70 ? 'high_amount' : riskScore >= 40 ? 'suspicious_location' : 'card_testing',
        score: riskScore,
        action: decision === 'block' ? 'block' : decision === 'challenge' ? 'challenge' : 'allow',
        metadata: {
          halo_decision: decision,
          halo_risk_score: riskScore
        }
      });
    }

    // Country-specific risk
    if (country && !['US', 'CA', 'GB', 'AU'].includes(country)) {
      signals.push({
        type: 'suspicious_location',
        score: 25,
        action: 'manual_review',
        metadata: { country }
      });
    }

    // High amount risk
    if (amount && amount > 100000) { // > $1000
      signals.push({
        type: 'high_amount',
        score: 35,
        action: 'challenge',
        metadata: { amount_cents: amount }
      });
    }

    return signals.length > 0 ? signals : [{
      type: 'card_testing',
      score: 0,
      action: 'allow',
      metadata: { status: 'clean' }
    }];
  }
}

export const paymentProcessor = new PaymentProcessor();
