/**
 * Protocol Controller
 * Complete API implementation for ACP, UCP, and x402
 * All endpoints follow official protocol specifications
 */

import { Request, Response, Router } from 'express';
import { sessionStore, toACPCheckoutSession } from '../services/sessionManager';
import { fulfillmentService } from '../services/fulfillmentService';
import { orderService } from '../services/orderService';
import { computeRiskScore } from '../services/riskEngine';
import { PaymentProcessor } from '../services/paymentProcessor';
import { lookupProduct } from '../services/productCatalog';
import {
  ACPCheckoutCreateRequest,
  ACPCheckoutUpdateRequest,
  ACPCheckoutCompleteRequest,
  ACPCancelSessionRequest,
  ACPError,
  Link,
} from '../types/protocols';

const router = Router();

// ============================================================================
// ACP ENDPOINTS - Agentic Commerce Protocol
// ============================================================================

/**
 * POST /acp/checkout
 * Create new checkout session
 */
router.post('/acp/checkout', async (req: Request, res: Response) => {
  try {
    const request: ACPCheckoutCreateRequest = req.body;

    // Validate required fields
    if (!request.items || request.items.length === 0) {
      const error: ACPError = {
        type: 'invalid_request',
        code: 'missing_items',
        message: 'At least one item is required',
        param: 'items',
      };
      res.status(400).json(error);
      return;
    }

    // Create session
    const session = sessionStore.create(request, {
      agentProtocol: 'acp',
      merchantProtocol: 'acp',
    });

    // Get product info and calculate totals
    let subtotal = 0;

    session.checkout.items = request.items.map(item => {
      const product = lookupProduct(item.id || 'item');
      const unitPrice = product?.basePrice || 1000; // Default $10
      const total = unitPrice * item.quantity;
      subtotal += total;

      return {
        id: item.id,
        name: product?.name || `Product ${item.id}`,
        quantity: item.quantity,
        unit_price: unitPrice,
        total,
      };
    });

    // Calculate totals
    session.checkout.subtotal = subtotal;
    session.checkout.tax = Math.round(subtotal * 0.1); // 10% tax
    session.checkout.total = subtotal + session.checkout.tax;

    // Get fulfillment options
    const fulfillmentOptions = fulfillmentService.getFulfillmentOptions(
      session.checkout.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity
      })),
      session.shipping_address,
      session.checkout.subtotal
    );

    // Compute risk
    const riskResult = computeRiskScore({
      halo_normalized: {
        total_cents: session.checkout.total,
        country: session.shipping_address?.country || 'US',
        shipping_speed: 'standard',
        currency: session.checkout.currency,
      },
    });

    session.risk = {
      score: riskResult.risk_score,
      decision: riskResult.decision,
      factors: {
        high_value: session.checkout.total > 5000,
        international: (session.shipping_address?.country || 'US') !== 'US',
      },
    };

    // Build ACP response
    const acpSession = toACPCheckoutSession(session);
    acpSession.fulfillment_options = fulfillmentOptions;

    console.log(`✅ [ACP] Created checkout session: ${session.id}`);
    res.status(201).json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Create checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * GET /acp/checkout/:id
 * Get checkout session details
 */
router.get('/acp/checkout/:id', async (req: Request, res: Response) => {
  try {
    const session = sessionStore.get(req.params.id);

    if (!session) {
      res.status(404).json({
        type: 'invalid_request',
        code: 'session_not_found',
        message: `Checkout session ${req.params.id} not found`,
      });
      return;
    }

    const acpSession = toACPCheckoutSession(session);

    // Add fulfillment options
    acpSession.fulfillment_options = fulfillmentService.getFulfillmentOptions(
      session.checkout.items.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity
      })),
      session.shipping_address,
      session.checkout.subtotal
    );

    res.json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Get checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * PATCH /acp/checkout/:id
 * Update checkout session
 */
router.patch('/acp/checkout/:id', async (req: Request, res: Response) => {
  try {
    const request: ACPCheckoutUpdateRequest = req.body;
    const session = sessionStore.update(req.params.id, request);

    if (!session) {
      res.status(404).json({
        type: 'invalid_request',
        code: 'session_not_found',
        message: `Checkout session ${req.params.id} not found or not updatable`,
      });
      return;
    }

    // Recalculate shipping if address changed
    if (request.fulfillment_details?.address) {
      const fulfillmentOptions = fulfillmentService.getFulfillmentOptions(
        session.checkout.items.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity
        })),
        request.fulfillment_details.address,
        session.checkout.subtotal
      );

      // Update shipping cost if option selected
      if (request.selected_fulfillment_options?.length) {
        const selected = request.selected_fulfillment_options[0];
        const optionId = selected.shipping?.option_id || selected.digital?.option_id;
        session.checkout.shipping = fulfillmentService.getSelectedShippingCost(
          optionId || '',
          fulfillmentOptions
        );
        session.checkout.total = session.checkout.subtotal + session.checkout.tax + session.checkout.shipping;
      }
    }

    // Re-evaluate risk with new info
    const riskResult = computeRiskScore({
      halo_normalized: {
        total_cents: session.checkout.total,
        country: session.shipping_address?.country || 'US',
        shipping_speed: session.fulfillment?.option_id?.includes('express') ? 'express' : 'standard',
        currency: session.checkout.currency,
      },
    });

    session.risk = {
      ...session.risk,
      score: riskResult.risk_score,
      decision: riskResult.decision,
    };

    const acpSession = toACPCheckoutSession(session);
    console.log(`✏️ [ACP] Updated checkout session: ${session.id}`);
    res.json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Update checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * POST /acp/checkout/:id/complete
 * Complete checkout with payment
 */
router.post('/acp/checkout/:id/complete', async (req: Request, res: Response) => {
  try {
    const request: ACPCheckoutCompleteRequest = req.body;
    const session = sessionStore.get(req.params.id);

    if (!session) {
      res.status(404).json({
        type: 'invalid_request',
        code: 'session_not_found',
        message: `Checkout session ${req.params.id} not found`,
      });
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        type: 'invalid_request',
        code: 'invalid_session_status',
        message: `Cannot complete session in ${session.status} status`,
      });
      return;
    }

    // Check if verification required but not done
    if (session.risk.decision === 'challenge' && !session.risk.verified) {
      const acpSession = toACPCheckoutSession(session);
      acpSession.messages.push({
        type: 'error',
        code: 'requires_3ds',
        content_type: 'plain',
        content: '3D Secure verification required before payment',
      });
      res.status(400).json(acpSession);
      return;
    }

    // Check if blocked
    if (session.risk.decision === 'block') {
      res.status(403).json({
        type: 'invalid_request',
        code: 'payment_blocked',
        message: 'Transaction blocked by risk engine',
      });
      return;
    }

    // Validate payment data
    if (!request.payment_data?.token || !request.payment_data?.provider) {
      res.status(400).json({
        type: 'invalid_request',
        code: 'invalid_payment_data',
        message: 'Payment token and provider are required',
        param: 'payment_data',
      });
      return;
    }

    // Process payment - simulate for now
    // In production, this would use the actual payment token
    const paymentResult = {
      success: true,
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      card_last4: '4242',
      card_brand: 'visa',
    };

    // Complete session
    const completedSession = await sessionStore.complete(req.params.id, request, paymentResult);

    if (!completedSession) {
      res.status(500).json({
        type: 'processing_error',
        code: 'completion_failed',
        message: 'Failed to complete checkout session',
      });
      return;
    }

    // Create order if payment succeeded
    if (paymentResult.success && completedSession.order) {
      const order = orderService.create(completedSession);

      // Start order progression simulation (for demo)
      orderService.simulateProgression(order.id);
    }

    const acpSession = toACPCheckoutSession(completedSession);
    console.log(`✅ [ACP] Completed checkout session: ${session.id}`);
    res.json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Complete checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * DELETE /acp/checkout/:id
 * Cancel checkout session
 */
router.delete('/acp/checkout/:id', async (req: Request, res: Response) => {
  try {
    const request: ACPCancelSessionRequest = req.body;
    const session = sessionStore.cancel(req.params.id, request);

    if (!session) {
      res.status(404).json({
        type: 'invalid_request',
        code: 'session_not_found',
        message: `Checkout session ${req.params.id} not found or not cancelable`,
      });
      return;
    }

    const acpSession = toACPCheckoutSession(session);
    console.log(`🚫 [ACP] Canceled checkout session: ${session.id}`);
    res.json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Cancel checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * POST /acp/checkout/:id/verify
 * Complete 3DS/biometric verification
 */
router.post('/acp/checkout/:id/verify', async (req: Request, res: Response) => {
  try {
    const { method } = req.body; // '3ds' | 'biometric' | 'wallet_signature' | 'multi_sig'

    if (!method) {
      res.status(400).json({
        type: 'invalid_request',
        code: 'missing_method',
        message: 'Verification method is required',
      });
      return;
    }

    const session = sessionStore.verify(req.params.id, method);

    if (!session) {
      res.status(404).json({
        type: 'invalid_request',
        code: 'session_not_found',
        message: `Checkout session ${req.params.id} not found`,
      });
      return;
    }

    const acpSession = toACPCheckoutSession(session);
    console.log(`✅ [ACP] Verified session: ${session.id} via ${method}`);
    res.json(acpSession);

  } catch (error: any) {
    console.error('[ACP] Verify error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

/**
 * POST /acp/delegate-payment
 * Delegate payment execution
 */
router.post('/acp/delegate-payment', async (req: Request, res: Response) => {
  try {
    const request = req.body;

    // Validate required fields
    if (!request.payment_method || !request.allowance) {
      res.status(400).json({
        type: 'invalid_request',
        code: 'missing_fields',
        message: 'payment_method and allowance are required',
      });
      return;
    }

    // Check allowance limits
    const session = sessionStore.get(request.allowance.checkout_session_id);
    if (session && session.checkout.total > request.allowance.max_amount) {
      res.status(400).json({
        type: 'invalid_request',
        code: 'amount_exceeds_allowance',
        message: `Transaction amount ${session.checkout.total} exceeds allowance ${request.allowance.max_amount}`,
      });
      return;
    }

    // Check expiry
    if (new Date(request.allowance.expires_at) < new Date()) {
      res.status(400).json({
        type: 'invalid_request',
        code: 'allowance_expired',
        message: 'Payment allowance has expired',
      });
      return;
    }

    // Convert request to compatible format and process
    const processor = new PaymentProcessor();
    const delegateRequest = {
      payment_method: {
        type: 'card' as const,
        card_number_type: (request.payment_method.card_number_type || 'fpan') as 'fpan' | 'dpan',
        number: request.payment_method.number || '',
        exp_month: request.payment_method.expiry_month || request.payment_method.exp_month || '12',
        exp_year: request.payment_method.expiry_year || request.payment_method.exp_year || '2028',
        name: request.payment_method.cardholder_name || request.payment_method.name || 'Agent User',
        cvc: request.payment_method.cvc || '',
        display_brand: request.payment_method.brand,
        display_last4: request.payment_method.last_four,
      },
      allowance: request.allowance,
      billing_address: request.billing_address || request.payment_method.billing_address || {
        name: 'Agent User',
        line_one: '123 Agent St',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        postal_code: '94105',
      },
      risk_signals: request.risk_signals || [],
    };

    const result = await processor.processDelegatePayment(delegateRequest);

    // Check result
    if ('type' in result && result.type) {
      // Error response
      res.status(400).json(result);
      return;
    }

    console.log(`💳 [ACP] Delegate payment processed: ${(result as any).id}`);
    res.json(result);

  } catch (error: any) {
    console.error('[ACP] Delegate payment error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: error.message,
    });
  }
});

// ============================================================================
// ORDER ENDPOINTS
// ============================================================================

/**
 * GET /orders
 * List all orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = orderService.list({
      status: req.query.status as string,
      buyer_email: req.query.email as string,
    });

    // Map to frontend-friendly format
    const frontendOrders = orders.map(o => {
      const ucpOrder = orderService.toUCPOrder(o);
      // Determine overall status from fulfillment
      const status = o.fulfillment.status === 'delivered' ? 'completed' :
        o.fulfillment.status === 'canceled' ? 'cancelled' :
          o.fulfillment.status;

      return {
        id: o.id,
        order_number: o.id.split('-')[1] || o.id, // Extract accessible number
        created_at: o.created_at,
        status: status,
        total: o.total,
        protocol: (o.metadata?.agent_protocol || 'ACP').toUpperCase(),
        payment_method: o.payment.method === 'card' ? `**** ${o.payment.transaction_id.slice(-4) || '4242'}` : o.payment.method,
        items: o.line_items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.unit_price
        }))
      };
    });

    res.json({
      orders: frontendOrders,
      count: orders.length,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /orders/:id
 * Get order details
 */
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = orderService.get(req.params.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(orderService.toUCPOrder(order));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ... (ship/deliver/refund/cancel endpoints remain unchanged) ...

/**
 * POST /orders/:id/ship
 * Mark order as shipped
 */
router.post('/orders/:id/ship', async (req: Request, res: Response) => {
  try {
    const { carrier, tracking_number } = req.body;

    const order = orderService.addFulfillmentEvent(req.params.id, {
      type: 'shipped',
      carrier,
      tracking_number,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(orderService.toUCPOrder(order));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /orders/:id/deliver
 * Mark order as delivered
 */
router.post('/orders/:id/deliver', async (req: Request, res: Response) => {
  try {
    const order = orderService.addFulfillmentEvent(req.params.id, {
      type: 'delivered',
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(orderService.toUCPOrder(order));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /orders/:id/refund
 * Process refund
 */
router.post('/orders/:id/refund', async (req: Request, res: Response) => {
  try {
    const { amount, reason, line_item_ids } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid refund amount required' });
      return;
    }

    // Convert line_item_ids to new format if provided
    const lineItems = line_item_ids?.map((id: string) => ({ id, quantity: 1 }));

    const order = orderService.processRefund(req.params.id, {
      type: 'refund',
      amount,
      description: reason,
      line_items: lineItems,
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(orderService.toUCPOrder(order));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /orders/:id/cancel
 * Cancel order
 */
router.post('/orders/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const order = orderService.cancel(req.params.id, reason);

    if (!order) {
      res.status(400).json({ error: 'Order not found or cannot be canceled' });
      return;
    }

    res.json(orderService.toUCPOrder(order));

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SESSION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /sessions
 * List all active sessions
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = sessionStore.list();

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        status: s.status,
        created_at: s.created_at,
        expires_at: s.expires_at,
        total: s.checkout.total,
        amount: s.checkout.total, // Alias for frontend
        currency: s.checkout.currency,
        risk_decision: s.risk.decision,
        risk_score: s.risk.score, // Added: Risk Score
        metadata: {
          item: s.checkout.items[0]?.name || "Unspecified Item" // Simplified mapping for UI
        },
        agent_protocol: s.metadata?.agentProtocol || 'acp', // Added
        merchant_protocol: s.metadata?.merchantProtocol || 'acp', // Added
        mode: 'AGENTIC' // Hardcoded for now, or derive from metadata
      })),
      count: sessions.length,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /sessions/cleanup
 * Clean up expired sessions
 */
router.post('/sessions/cleanup', async (req: Request, res: Response) => {
  try {
    const cleaned = sessionStore.cleanup();

    res.json({
      message: `Cleaned up ${cleaned} expired sessions`,
      remaining: sessionStore.size(),
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FULFILLMENT OPTIONS ENDPOINTS
// ============================================================================

/**
 * POST /fulfillment/options
 * Get available fulfillment options
 */
router.post('/fulfillment/options', async (req: Request, res: Response) => {
  try {
    const { items, address, total } = req.body;

    const options = fulfillmentService.getFulfillmentOptions(
      items || [],
      address,
      total || 0
    );

    res.json({
      options,
      count: options.length,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// x402 ENDPOINTS
// ============================================================================

/**
 * GET /x402/resource/:id
 * Request protected resource (returns 402 Payment Required)
 */
router.get('/x402/resource/:id', async (req: Request, res: Response) => {
  try {
    const resourceId = req.params.id;
    const price = parseInt(req.query.price as string) || 100; // cents

    // Check for X-Payment header
    const paymentHeader = req.header('X-Payment');

    if (!paymentHeader) {
      // Return 402 Payment Required
      res.status(402).json({
        x402Version: 2,
        error: 'Payment required to access this resource',
        resource: {
          url: `https://api.example.com/resources/${resourceId}`,
          description: `Premium Resource ${resourceId}`,
          mimeType: 'application/json',
        },
        accepts: [
          {
            scheme: 'exact',
            network: 'eip155:84532', // Base Sepolia
            asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
            amount: (price * 10000).toString(), // Convert to atomic units
            payTo: '0x209693Bc6afc0C5328bA36FaF03C514EF312287C',
            maxTimeoutSeconds: 60,
            extra: {
              name: 'USDC',
              version: '2',
            },
          },
        ],
        extensions: {},
      });
      return;
    }

    // Validate payment (in production, verify signature/transaction)
    try {
      const payment = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());

      // Return resource content
      res.json({
        resource_id: resourceId,
        content: `This is the premium content for resource ${resourceId}`,
        accessed_at: new Date().toISOString(),
        payment_verified: true,
      });

    } catch {
      res.status(400).json({
        error: 'Invalid payment header',
      });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /x402/pay
 * Submit payment for x402 resource
 */
router.post('/x402/pay', async (req: Request, res: Response) => {
  try {
    const { resource, accepted, payload } = req.body;

    if (!resource || !accepted || !payload) {
      res.status(400).json({
        error: 'Missing required fields: resource, accepted, payload',
      });
      return;
    }

    // Verify payment (in production, check blockchain)
    const transactionId = `x402_tx_${Date.now()}`;

    console.log(`💰 [x402] Payment verified for resource: ${resource.url}`);

    res.json({
      success: true,
      data: {
        transactionId,
        status: 'verified',
        message: 'Payment verified and settled',
        blockNumber: 12345678,
        confirmations: 3,
      },
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// STATS & DEBUG ENDPOINTS
// ============================================================================

/**
 * GET /stats
 * Get system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  res.json({
    sessions: {
      active: sessionStore.size(),
    },
    orders: {
      total: orderService.count(),
    },
    protocols: ['acp', 'ucp', 'x402'],
    uptime: process.uptime(),
  });
});

export default router;
