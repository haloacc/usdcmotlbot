/**
 * Orchestration Controller
 * Handles universal protocol orchestration via ProtocolRouter
 */

import { Request, Response } from 'express';
import { ProtocolRouter } from '../protocols/ProtocolRouter';
import { sessionStore } from '../services/sessionManager';
import { orderService } from '../services/orderService';

export class OrchestrationController {
  private router: ProtocolRouter;

  constructor() {
    this.router = ProtocolRouter.getInstance();
    this.router.initialize();
  }

  /**
   * POST /halo/orchestrate
   * Auto-detect agent protocol and translate to merchant protocol
   * 
   * Body:
   * {
   *   "request": <agent's request in any protocol>,
   *   "merchantProtocol": "acp|ucp|x402",
   *   "merchantContext": {
   *     "merchantName": "CyberShop",
   *     "merchantId": "merchant_123",
   *     "merchantWallet": "0x...",
   *     "resourceUrl": "https://api.cybershop.com/checkout"
   *   }
   * }
   */
  public orchestrate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { request: agentRequest, merchantProtocol, merchantContext } = req.body;

      if (!agentRequest) {
        res.status(400).json({
          error: 'Missing required field: request',
          hint: 'Provide the agent\'s request in any supported protocol',
        });
        return;
      }

      if (!merchantProtocol) {
        res.status(400).json({
          error: 'Missing required field: merchantProtocol',
          hint: 'Specify merchant protocol: acp, ucp, or x402',
        });
        return;
      }

      // Orchestrate with auto-detection
      const result = await this.router.orchestrate(agentRequest, {
        merchantProtocol,
        merchantContext,
        autoDetect: true,
      });

      if (!result.success) {
        res.status(400).json({
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        orchestrator: 'halo',
        agentProtocol: result.agentProtocol,
        merchantProtocol: result.merchantProtocol,
        response: result.merchantResponse,
        canonical: result.canonical,
      });
    } catch (error: any) {
      console.error('[OrchestrationController] Error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * POST /halo/orchestrate/:agentProtocol/:merchantProtocol
   * Explicit protocol specification (no auto-detection)
   * 
   * Example: POST /halo/orchestrate/ucp/acp
   */
  public orchestrateExplicit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentProtocol, merchantProtocol } = req.params;
      const { request: agentRequest, merchantContext } = req.body;

      if (!agentRequest) {
        res.status(400).json({
          error: 'Missing required field: request',
        });
        return;
      }

      // Orchestrate with explicit protocols
      const result = await this.router.orchestrate(agentRequest, {
        agentProtocol,
        merchantProtocol,
        merchantContext,
        autoDetect: false,
      });

      if (!result.success) {
        res.status(400).json({
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        agentProtocol: result.agentProtocol,
        merchantProtocol: result.merchantProtocol,
        response: result.merchantResponse,
        canonical: result.canonical,
      });
    } catch (error: any) {
      console.error('[OrchestrationController] Error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * GET /halo/protocols
   * List all supported protocols
   */
  public listProtocols = async (req: Request, res: Response): Promise<void> => {
    try {
      const protocols = this.router.getSupportedProtocols();

      res.json({
        protocols,
        count: protocols.length,
        combinations: protocols.length * protocols.length,
        examples: [
          { agent: 'acp', merchant: 'ucp', description: 'OpenAI agent → UCP merchant' },
          { agent: 'ucp', merchant: 'x402', description: 'UCP agent → x402 merchant' },
          { agent: 'x402', merchant: 'acp', description: 'x402 agent → ACP merchant' },
        ],
      });
    } catch (error: any) {
      console.error('[OrchestrationController] Error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * POST /halo/detect
   * Detect protocol from request without processing
   */
  public detectProtocol = async (req: Request, res: Response): Promise<void> => {
    try {
      const { request } = req.body;

      if (!request) {
        res.status(400).json({
          error: 'Missing required field: request',
        });
        return;
      }

      const protocol = this.router.detectProtocol(request);

      if (!protocol) {
        res.json({
          detected: false,
          protocol: null,
          hint: 'Could not auto-detect protocol. Request may be malformed or unsupported.',
        });
        return;
      }

      const adapter = this.router.getAdapter(protocol);

      res.json({
        detected: true,
        protocol,
        metadata: {
          name: adapter?.protocolName,
          version: adapter?.version,
          description: adapter?.description,
        },
      });
    } catch (error: any) {
      console.error('[OrchestrationController] Error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * POST /halo/process-natural-language
   * Process natural language input from chat UI
   * This is for backward compatibility with the existing chat interface
   */
  public processNaturalLanguage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, merchantProtocol } = req.body;

      if (!prompt) {
        res.status(400).json({
          error: 'Missing required field: prompt',
        });
        return;
      }

      // Parse natural language to UCP intent (default agent protocol)
      const { parsePrompt } = require('../services/promptParser');
      const parsedPrompt = parsePrompt(prompt);

      const lineItems = this.buildLineItemsFromPrompt(parsedPrompt);
      const intentItems = lineItems.map(({ item, quantity }) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity,
        price: item.price,
      }));

      // Build UCP-style request from parsed prompt
      const ucpRequest = {
        line_items: lineItems,
        intent: {
          action: 'checkout',
          items: intentItems,
        },
        buyer: {
          preferences: {
            shipping_speed: parsedPrompt.shipping_speed,
            country: parsedPrompt.country,
          },
        },
        capabilities: {
          supportedPaymentMethods: ['card'],
          supportedCurrencies: [parsedPrompt.currency || 'USD'],
        },
      };

      // Orchestrate to merchant protocol
      const result = await this.router.orchestrate(ucpRequest, {
        agentProtocol: 'ucp', // Natural language parsed to UCP
        merchantProtocol: merchantProtocol || 'acp', // Default to ACP
        merchantContext: {
          merchantName: parsedPrompt.merchantName || 'Demo Merchant',
          merchantId: 'demo_merchant',
        },
      });

      if (!result.success) {
        res.status(400).json({
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        orchestrator: 'halo',
        prompt,
        parsed: parsedPrompt,
        agentProtocol: 'ucp',
        merchantProtocol: result.merchantProtocol,
        response: result.merchantResponse,
        canonical: result.canonical,
      });
    } catch (error: any) {
      console.error('[OrchestrationController] Error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * POST /halo/agentic-checkout
   * TRUE AGENTIC FLOW: Agent pays on user's behalf using delegated credentials
   * 
   * This is the core Halo value proposition:
   * 1. User provides natural language request + delegated payment method
   * 2. Halo negotiates capabilities with merchant
   * 3. Halo executes payment automatically
   * 4. User receives payment confirmation (NOT a checkout link)
   */
  public agenticCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        prompt,
        merchantProtocol,
        delegatedPayment, // User's pre-authorized payment credentials
        verified // If true, user has completed 3DS/step-up verification
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Missing required field: prompt' });
        return;
      }

      console.log('🤖 [HALO] Starting AGENTIC checkout (agent pays on behalf of user)...');

      // Step 1: Parse natural language
      const { parsePrompt } = require('../services/promptParser');
      const parsedPrompt = parsePrompt(prompt);

      // Ensure amount_cents is a valid number
      if (!parsedPrompt.amount_cents || isNaN(parsedPrompt.amount_cents)) {
        console.warn(`⚠️ [HALO] Amount parsing failed for prompt: "${prompt}". Defaulting to 1000 cents.`);
        parsedPrompt.amount_cents = 1000; // Default to $10.00
      }

      console.log(`📝 [HALO] Parsed: ${parsedPrompt.item_name} for ${parsedPrompt.amount_cents / 100} ${parsedPrompt.currency}`);

      // Step 2: Get/create delegated payment credentials
      // In production, these would be stored securely (Stripe Customer, vault, etc.)
      const paymentCredentials = delegatedPayment || this.getDefaultDelegatedPayment(parsedPrompt);
      console.log(`💳 [HALO] Using delegated payment: ****${paymentCredentials.card_last4}`);

      // Step 3: Build agent request with capabilities
      const { getDefaultAgentCapabilities, negotiateCapabilities } = require('../services/capabilityNegotiator');
      const agentCapabilities = getDefaultAgentCapabilities();

      const agentLineItems = this.buildLineItemsFromPrompt(parsedPrompt);
      const agentIntentItems = agentLineItems.map(({ item, quantity }) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity,
        price: item.price,
      }));

      const agentRequest = {
        line_items: agentLineItems,
        intent: {
          action: 'checkout_and_pay', // Agent will complete payment
          items: agentIntentItems,
        },
        buyer: {
          preferences: {
            shipping_speed: parsedPrompt.shipping_speed,
            country: parsedPrompt.country,
          },
        },
        agent_capabilities: agentCapabilities,
        delegated_payment: true, // Signal that agent will pay
      };

      // Step 4: Orchestrate to get checkout session (for capability check)
      const checkoutResult = await this.router.orchestrate(agentRequest, {
        agentProtocol: 'ucp',
        merchantProtocol: merchantProtocol || 'acp',
        merchantContext: {
          merchantName: parsedPrompt.merchantName || 'Demo Merchant',
          merchantId: 'demo_merchant',
        },
      });

      if (!checkoutResult.success) {
        res.status(400).json({ error: checkoutResult.error });
        return;
      }

      // Step 4b: Store session in sessionStore for tracking
      const session = sessionStore.create(
        {
          items: [{
            id: `item_${Date.now()}`,
            quantity: parsedPrompt.quantity || 1,
          }],
        },
        {
          agentProtocol: 'ucp',
          merchantProtocol: merchantProtocol || 'acp',
        }
      );

      // Update session with actual amounts
      session.checkout.items = [{
        id: `item_${Date.now()}`,
        name: parsedPrompt.item_name,
        quantity: parsedPrompt.quantity || 1,
        unit_price: parsedPrompt.amount_cents,
        total: parsedPrompt.amount_cents,
      }];
      session.checkout.currency = parsedPrompt.currency || 'USD';
      session.checkout.subtotal = parsedPrompt.amount_cents;
      session.checkout.tax = Math.round(parsedPrompt.amount_cents * 0.1);
      session.checkout.total = session.checkout.subtotal + session.checkout.tax;

      console.log(`📦 [HALO] Created session: ${session.id}, Total: $${session.checkout.total / 100}`);

      // Step 5: Capability Negotiation
      const sellerCapabilities = (checkoutResult.canonical as any).seller_capabilities;
      const negotiationResult = negotiateCapabilities(agentCapabilities, sellerCapabilities);

      console.log(`🤝 [HALO] Capability negotiation: ${negotiationResult.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`);

      if (!negotiationResult.compatible) {
        res.status(400).json({
          error: 'Capability negotiation failed',
          details: negotiationResult.messages,
          agent_capabilities: agentCapabilities,
          seller_capabilities: sellerCapabilities,
        });
        return;
      }

      // Step 6: Risk check (already done in orchestration, get result)
      const riskResult = (checkoutResult.canonical as any).halo_risk;

      // Update session with risk info
      session.risk = {
        score: riskResult?.score || 0,
        decision: riskResult?.decision || 'approve',
        factors: riskResult?.factors || {},
      };

      if (riskResult?.decision === 'block') {
        console.log('🚫 [HALO] Transaction BLOCKED by risk engine');
        session.status = 'canceled';
        res.status(403).json({
          success: false,
          error: 'Transaction blocked by Halo risk engine',
          risk_evaluation: riskResult,
          parsed: parsedPrompt,
        });
        return;
      }

      // Step 6b: Challenge requires step-up verification
      if (riskResult?.decision === 'challenge' && !verified) {
        console.log('⚠️ [HALO] Transaction requires step-up verification');

        // Different verification methods based on protocol
        const protocolLower = (merchantProtocol || 'acp').toLowerCase();
        const isX402 = protocolLower === 'x402';
        const verificationMethods = isX402
          ? ['wallet_signature', 'multi_sig'] // Crypto verification
          : ['3ds', 'biometric'];              // Card verification

        const verificationMessage = isX402
          ? 'Additional wallet signature required. Sign the transaction in your wallet to proceed.'
          : 'Additional verification required. Complete 3DS or biometric authentication to proceed.';

        res.json({
          success: true,
          requires_verification: true,
          orchestrator: 'halo',
          mode: 'agentic',
          prompt,
          parsed: parsedPrompt,
          agentProtocol: 'ucp',
          merchantProtocol: checkoutResult.merchantProtocol,
          capability_negotiation: {
            compatible: negotiationResult.compatible,
            matched_payment_methods: negotiationResult.matched_payment_methods,
            messages: negotiationResult.messages,
          },
          risk_evaluation: riskResult,
          verification_methods: verificationMethods,
          message: verificationMessage,
        });
        return;
      }

      // Step 7: EXECUTE PAYMENT (the agentic part!)
      console.log('💎 [HALO] Executing Economic OS Transition (Arc Blockchain)...');
      const { PaymentProcessor } = require('../services/paymentProcessor');
      const processor = new PaymentProcessor();

      const delegatePaymentRequest = {
        payment_method: {
          type: 'card' as const,
          card_number_type: 'network_token' as const,
          number: paymentCredentials.token || '4242424242424242', // Fallback for legacy flow
          exp_month: paymentCredentials.exp_month || paymentCredentials.card_exp_month,
          exp_year: paymentCredentials.exp_year || paymentCredentials.card_exp_year,
          display_card_funding_type: 'credit' as const,
          display_brand: paymentCredentials.brand || paymentCredentials.card_brand,
          display_last4: paymentCredentials.card_last4,
          metadata: {
            stripe_payment_method_id: paymentCredentials.stripe_payment_method_id, // Use existing PM if available
          },
        },
        billing_address: {
          name: 'Demo User',
          line_one: '123 AI Street',
          line_two: '',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          postal_code: '94105',
        },
        allowance: {
          reason: 'one_time' as const,
          max_amount: parsedPrompt.amount_cents,
          currency: (parsedPrompt.currency || 'USD').toLowerCase(),
          checkout_session_id: (checkoutResult.canonical as any).id,
          merchant_id: 'demo_merchant',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
        },
        risk_signals: [{
          type: 'card_testing' as const,
          score: riskResult?.score || 0,
          action: riskResult?.decision === 'challenge' ? 'manual_review' as const : 'authorized' as const,
        }],
        metadata: {
          source: 'halo_arc_transition',
          prompt: prompt.substring(0, 100),
          settlement_method: 'arc', // Default to Arc Blockchain for all agentic transactions
          arc_chain_id: 'eip155:arc'
        },
      };

      const paymentResult = await processor.processDelegatePayment(delegatePaymentRequest);

      // Check if payment succeeded
      const paymentSucceeded = 'id' in paymentResult && !('type' in paymentResult);

      if (!paymentSucceeded) {
        console.log('❌ [HALO] Payment FAILED:', paymentResult);
        res.status(400).json({
          success: false,
          orchestrator: 'halo',
          stage: 'payment_execution',
          error: (paymentResult as any).message || 'Payment failed',
          error_code: (paymentResult as any).code,
        });
        return;
      }

      console.log('✅ [HALO] Payment SUCCEEDED:', (paymentResult as any).id);

      // Step 8: Mark session as completed and create order
      session.status = 'completed';
      session.payment = {
        status: 'completed',
        method: 'card',
        transaction_id: (paymentResult as any).id,
        amount: session.checkout.total,
        currency: session.checkout.currency,
        card_last4: paymentCredentials.card_last4,
        card_brand: paymentCredentials.brand,
      };
      session.order = {
        id: `order_${Date.now()}`,
        permalink_url: `https://merchant.example.com/orders/order_${Date.now()}`,
        fulfillment_status: 'pending',
      };

      // Create order for tracking
      const order = orderService.create(session);
      console.log(`📦 [HALO] Created order: ${order.id}`);

      // Simulate order progression for demo
      orderService.simulateProgression(order.id);

      // Log protocol trace
      console.log('📊 [HALO] Protocol Trace:');
      console.log('  Agent Protocol: UCP');
      console.log(`  Merchant Protocol: ${checkoutResult.merchantProtocol}`);
      console.log('  Risk Score:', riskResult?.score || 0);
      console.log('  Risk Decision:', riskResult?.decision || 'approve');
      console.log('  Capability Negotiation:', negotiationResult.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE');
      console.log('  Payment Status: COMPLETED');

      // Step 9: Return success in PROTOCOL FORMAT - payment is DONE!
      // This response follows ACP completion schema
      const acpCompletionResponse = {
        id: session.id,
        status: 'completed' as const,
        order: {
          id: order.id,
          status: 'confirmed' as const,
          permalink_url: order.permalink_url,
          receipt_url: `${process.env.BASE_URL || 'http://localhost:3000'}/receipt.html?order_id=${order.id}`,
        },
        payment: {
          id: (paymentResult as any).id,
          status: 'succeeded' as const,
          amount: {
            value: parsedPrompt.amount_cents / 100,
            currency: (parsedPrompt.currency || 'USD').toLowerCase(),
          },
          payment_method: {
            type: 'card' as const,
            brand: paymentCredentials.brand,
            last4: paymentCredentials.card_last4,
          },
          created_at: new Date().toISOString(),
        },
        fulfillment: {
          status: 'pending' as const,
          expectations: [{
            type: 'shipping' as const,
            window: {
              start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            tracking_available: false,
          }],
        },
        line_items: session.checkout.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: {
            amount: item.unit_price / 100,
            currency: session.checkout.currency.toLowerCase(),
          },
        })),
      };

      // Return protocol-compliant response
      res.json({
        success: true,
        payment_completed: true, // Signal to frontend
        orchestrator: 'halo',
        mode: 'agentic', // User didn't click anything, agent paid!

        // Protocol information
        agentProtocol: 'ucp',
        merchantProtocol: checkoutResult.merchantProtocol,

        // Protocol-compliant response (ACP format)
        acp_response: acpCompletionResponse,

        // Additional metadata for frontend
        order_number: order.id,
        halo_session_id: session.id,
        stripe_session_id: (checkoutResult.canonical as any).id,

        // Legacy fields for backward compatibility
        prompt,
        parsed: parsedPrompt,
        capability_negotiation: {
          compatible: negotiationResult.compatible,
          matched_payment_methods: negotiationResult.matched_payment_methods,
          messages: negotiationResult.messages,
        },
        risk_evaluation: riskResult,
        payment: {
          status: 'completed',
          transaction_id: (paymentResult as any).id,
          amount_cents: parsedPrompt.amount_cents,
          currency: parsedPrompt.currency || 'USD',
          card_last4: paymentCredentials.card_last4,
          card_brand: paymentCredentials.brand,
          created: (paymentResult as any).created,
        },
        checkout_session: checkoutResult.canonical,
      });

    } catch (error: any) {
      console.error('[OrchestrationController] Agentic checkout error:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  };

  /**
   * Get default delegated payment for demo purposes
   * In production, this would come from user's stored payment methods
   */
  private getDefaultDelegatedPayment(parsedPrompt: any) {
    // In production: Agent would have user's stored payment method token
    // For demo: Using Stripe test card number (processor maps it to token)
    return {
      token: '4242424242424242', // Stripe test card number for success
      card_last4: '4242',
      brand: 'visa',
      exp_month: '12',
      exp_year: '2028',
    };
  }

  private buildLineItemsFromPrompt(parsedPrompt: any) {
    const currency = parsedPrompt.currency || 'USD';
    const quantity = parsedPrompt.quantity || 1;
    const amountMajor = typeof parsedPrompt.amount_cents === 'number'
      ? parsedPrompt.amount_cents / 100
      : 0;
    const itemName = parsedPrompt.item_name || 'Item';
    const itemId = parsedPrompt.item_id || `item_${Date.now()}`;

    return [{
      item: {
        id: itemId,
        name: itemName,
        description: itemName,
        price: {
          amount: amountMajor,
          currency,
        },
      },
      quantity,
    }];
  }
}
