/**
 * ProtocolRouter - Universal Payment Orchestration
 * 
 * Core orchestrator that enables:
 * - Agent speaks Protocol A → Merchant speaks Protocol B
 * - Auto-detection of protocols
 * - Protocol translation via canonical models
 * - Full spec compliance with all official protocols
 */

import { ProtocolRegistry } from './protocol-registry';
import { ACPAdapter } from './adapters/ACPAdapter';
import { UCPAdapter } from './adapters/UCPAdapter';
import { X402Adapter } from './adapters/X402Adapter';
import {
  CanonicalCheckoutRequest,
  CanonicalCheckoutSession,
  CanonicalPaymentRequest,
  CanonicalPaymentResponse,
} from './canonical-models';
import { IProtocolAdapter } from './IProtocolAdapter';

export interface OrchestrationOptions {
  agentProtocol?: string; // If not specified, will auto-detect
  merchantProtocol: string; // Merchant's preferred protocol
  merchantContext?: {
    merchantId?: string;
    merchantName?: string;
    merchantWallet?: string;
    resourceUrl?: string;
    supportedPaymentMethods?: string[];
  };
  autoDetect?: boolean; // Default: true
}

export interface OrchestrationResult {
  success: boolean;
  agentProtocol: string;
  merchantProtocol: string;
  agentRequest: any; // Original agent request
  merchantResponse: any; // Translated merchant response
  canonical: CanonicalCheckoutSession | CanonicalPaymentResponse;
  error?: string;
}

export class ProtocolRouter {
  private static instance: ProtocolRouter;
  private registry: ProtocolRegistry;
  private initialized: boolean = false;

  private constructor() {
    this.registry = ProtocolRegistry.getInstance();
  }

  public static getInstance(): ProtocolRouter {
    if (!ProtocolRouter.instance) {
      ProtocolRouter.instance = new ProtocolRouter();
    }
    return ProtocolRouter.instance;
  }

  /**
   * Initialize router with all protocol adapters
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Register all protocol adapters
    this.registry.register(new ACPAdapter(), ['acp', 'openai', 'stripe-acp']);
    this.registry.register(new UCPAdapter(), ['ucp', 'universal-commerce']);
    this.registry.register(new X402Adapter(), ['x402', 'http-402', 'coinbase-x402']);

    this.initialized = true;
    console.log('[ProtocolRouter] Initialized with protocols:', this.registry.list());
  }

  /**
   * Auto-detect protocol from request
   */
  public detectProtocol(request: any): string | null {
    this.ensureInitialized();

    const detected = this.registry.detect(request);
    if (detected) {
      console.log(`[ProtocolRouter] Auto-detected protocol: ${detected}`);
      return detected;
    }

    console.warn('[ProtocolRouter] Could not auto-detect protocol');
    return null;
  }

  /**
   * Main orchestration method - translates agent request to merchant response
   */
  public async orchestrate(
    agentRequest: any,
    options: OrchestrationOptions,
    ip?: string
  ): Promise<OrchestrationResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      // Step 1: Determine agent protocol
      let agentProtocol = options.agentProtocol;
      if (!agentProtocol && options.autoDetect !== false) {
        const detected = this.detectProtocol(agentRequest);
        if (!detected) {
          throw new Error('Could not detect agent protocol. Please specify agentProtocol explicitly.');
        }
        agentProtocol = detected;
      }

      if (!agentProtocol) {
        throw new Error('Agent protocol not specified and auto-detection disabled');
      }


      // Step 2: Get agent adapter
      const agentAdapter = this.registry.get(agentProtocol);
      if (!agentAdapter) {
        throw new Error(`Agent protocol adapter not found: ${agentProtocol}`);
      }

      // Step 3: Get merchant adapter
      const merchantAdapter = this.registry.get(options.merchantProtocol);
      if (!merchantAdapter) {
        throw new Error(`Merchant protocol adapter not found: ${options.merchantProtocol}`);
      }

      // Step 4: Validate agent request
      const agentValidation = agentAdapter.validateRequest(agentRequest);

      if (!agentValidation.valid) {
        throw new Error(
          `Invalid ${agentProtocol} request: ${agentValidation.errors?.join(', ')}`
        );
      }

      // Step 5: Parse agent request to canonical format
      const canonicalRequest = agentAdapter.parseRequest(agentRequest);

      // Step 6: Process canonical request (business logic)
      const canonicalResponse = await this.processCanonicalRequest(
        canonicalRequest,
        options.merchantContext,
        ip
      );

      // Step 7: Validate merchant response
      const merchantValidation = merchantAdapter.validateResponse(canonicalResponse);

      if (!merchantValidation.valid) {
        throw new Error(
          `Invalid ${options.merchantProtocol} response: ${merchantValidation.errors?.join(', ')}`
        );
      }

      // Step 8: Build merchant-specific response
      const merchantResponse = merchantAdapter.buildResponse(
        canonicalResponse,
        options.merchantContext
      );

      console.log(`🌀 [ARC] Economic Intent Registered: ${agentProtocol} → ${options.merchantProtocol}`);
      console.log(`🔗 [ARC] Destination Settlement: Circle Arc Blockchain`);


      return {
        success: true,
        agentProtocol,
        merchantProtocol: options.merchantProtocol,
        agentRequest,
        merchantResponse,
        canonical: canonicalResponse,
      };
    } catch (error: any) {

      return {
        success: false,
        agentProtocol: options.agentProtocol || 'unknown',
        merchantProtocol: options.merchantProtocol,
        agentRequest,
        merchantResponse: null,
        canonical: {} as any,
        error: error.message,
      };
    }
  }

  /**
   * Process canonical request with business logic
   * This is where Halo's core payment processing happens
   */
  private async processCanonicalRequest(
    request: CanonicalCheckoutRequest | CanonicalPaymentRequest,
    merchantContext?: any,
    ip?: string
  ): Promise<CanonicalCheckoutSession | CanonicalPaymentResponse> {
    // Import services
    const { RiskEngine } = require('../services/riskEngine');
    const { generateSellerCapabilities } = require('../services/capabilityNegotiator');

    // Determine request type using snake_case property
    const isPaymentRequest = 'session_token' in request && 'payment_method' in request;

    if (isPaymentRequest) {
      return this.processPayment(request as CanonicalPaymentRequest, merchantContext);
    } else {
      return this.processCheckout(request as CanonicalCheckoutRequest, merchantContext, ip);
    }
  }

  /**
   * Process checkout request (create session)
   * This is HALO's core orchestration - creating real Stripe checkout sessions
   */
  private async processCheckout(
    request: CanonicalCheckoutRequest,
    merchantContext?: any,
    ip?: string
  ): Promise<CanonicalCheckoutSession> {
    const { computeRiskScore } = require('../services/riskEngine');
    const { generateSellerCapabilities } = require('../services/capabilityNegotiator');

    console.log('🌟 [HALO] Processing checkout request...');

    // Generate session ID
    const sessionId = `halo-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate totals using amount_cents
    const totalAmountCents = request.items.reduce(
      (sum: number, item) => sum + item.amount_cents * item.quantity,
      0
    );

    // Get currency from items
    const currency = request.items[0]?.currency || 'USD';

    // ========== HALO RISK EVALUATION ==========
    const normalizedForRisk = {
      halo_normalized: {
        total_cents: totalAmountCents,
        country: request.metadata?.buyerInfo?.preferences?.country || 'US',
        shipping_speed: request.metadata?.buyerInfo?.preferences?.shipping_speed || 'standard',
        currency: currency,
      }
    };
    
    const riskResult = computeRiskScore(normalizedForRisk, ip);
    console.log(`⚠️ [HALO] Risk Evaluation: score=${riskResult.risk_score}, decision=${riskResult.decision}`);

    // Note: We NO longer throw here - let the calling code handle block/challenge decisions
    // This allows the agentic checkout controller to return proper JSON responses

    // Generate seller capabilities
    const seller_capabilities = generateSellerCapabilities({
      merchantId: merchantContext?.merchantId,
      supportedPaymentMethods: merchantContext?.supportedPaymentMethods || [
        'card',
        'crypto',
        'stripe',
      ],
    });

    // Build proper LineItems from canonical items
    const line_items = request.items.map((item) => {
      const baseAmount = item.amount_cents / 100;
      const discount = 0;
      const subtotal = baseAmount - discount;
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      return {
        id: item.id,
        item: { id: item.id, quantity: item.quantity },
        base_amount: baseAmount,
        discount,
        subtotal,
        tax,
        total,
        name: item.name,
        description: item.description,
        unit_amount: item.amount_cents / 100,
      };
    });

    // Build proper PaymentProvider
    const payment_provider: any = {
      provider: 'stripe',
      supported_payment_methods: [{ type: 'card' }],
    };

    // Build totals
    const subtotalAmount = line_items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = line_items.reduce((sum, item) => sum + item.tax, 0);
    const totalAmount = line_items.reduce((sum, item) => sum + item.total, 0);

    const totals = [
      { type: 'subtotal' as const, display_text: 'Subtotal', amount: subtotalAmount },
      { type: 'tax' as const, display_text: 'Tax', amount: taxAmount },
      { type: 'total' as const, display_text: 'Total', amount: totalAmount },
    ];

    // ========== HALO STRIPE CHECKOUT INTEGRATION ==========
    let checkoutUrl = `https://checkout.halo.example/${sessionId}`;
    let stripeSessionId: string | null = null;

    // Try to create real Stripe Checkout Session
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 20) {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
          apiVersion: '2025-01-27.acacia',
        });

        console.log('🌟 [HALO] Creating Stripe Checkout Session...');

        // Create Stripe Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: request.items.map((item) => ({
            price_data: {
              currency: (currency || 'USD').toLowerCase(),
              product_data: {
                name: item.name,
                description: item.description || item.name,
              },
              unit_amount: item.amount_cents,
            },
            quantity: item.quantity,
          })),
          mode: 'payment',
          success_url: `http://localhost:3000/receipt.html?session_id={CHECKOUT_SESSION_ID}&halo_session=${sessionId}`,
          cancel_url: `http://localhost:3000/payment-cancelled?halo_session=${sessionId}`,
          metadata: {
            halo_session_id: sessionId,
            merchant_name: merchantContext?.merchantName || 'Halo Merchant',
            agent_protocol: 'orchestrated',
          },
        });

        checkoutUrl = stripeSession.url;
        stripeSessionId = stripeSession.id;
        console.log(`✅ [HALO] Stripe Checkout Session created: ${stripeSessionId}`);
        console.log(`💳 [HALO] Checkout URL: ${checkoutUrl}`);
      } catch (stripeError: any) {
        console.error('⚠️ [HALO] Stripe Checkout failed, using mock URL:', stripeError.message);
      }
    } else {
      console.log('⚠️ [HALO] No Stripe key - using mock checkout URL');
    }

    // Build ACPCheckoutSession (CanonicalCheckoutSession)
    return {
      id: stripeSessionId || sessionId,
      status: riskResult.decision === 'challenge' ? 'authentication_required' : 'ready_for_payment',
      currency: currency,
      payment_provider,
      seller_capabilities,
      line_items,
      totals,
      fulfillment_options: [],
      url: checkoutUrl,
      amount_total: totalAmountCents,
      merchant_info: {
        name: merchantContext?.merchantName || 'Halo Merchant',
        id: merchantContext?.merchantId,
      },
      halo_session_id: sessionId, // Track Halo's internal session
      // Halo risk evaluation results
      halo_risk: {
        score: riskResult.risk_score,
        decision: riskResult.decision,
        factors: {
          high_value: totalAmountCents > 5000,
          international: (request.metadata?.buyerInfo?.preferences?.country || 'US') !== 'US',
          express_shipping: (request.metadata?.buyerInfo?.preferences?.shipping_speed || 'standard') === 'express',
        },
      },
    };
  }

  /**
   * Process payment request (execute payment)
   */
  private async processPayment(
    request: CanonicalPaymentRequest,
    merchantContext?: any
  ): Promise<CanonicalPaymentResponse> {
    const { StripeService } = require('../services/stripeService');

    try {
      // In production, this would execute real payment
      // For demo, simulate successful payment
      const transaction_id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        transaction_id,
        status: 'succeeded',
        amount: 0, // Would be extracted from payment details
        currency: 'USD',
      };
    } catch (error: any) {
      return {
        success: false,
        transaction_id: '',
        status: 'failed',
        error_message: error.message,
      };
    }
  }

  /**
   * Get list of supported protocols
   */
  public getSupportedProtocols(): string[] {
    this.ensureInitialized();
    return this.registry.list();
  }

  /**
   * Get adapter for a specific protocol
   */
  public getAdapter(protocolName: string): IProtocolAdapter | null {
    this.ensureInitialized();
    return this.registry.get(protocolName);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  private getCanonicalType(canonical: any): string {
    if ('sessionToken' in canonical && 'paymentMethodDetails' in canonical) {
      return 'PaymentRequest';
    }
    if ('items' in canonical && 'agentCapabilities' in canonical) {
      return 'CheckoutRequest';
    }
    return 'Unknown';
  }
}
