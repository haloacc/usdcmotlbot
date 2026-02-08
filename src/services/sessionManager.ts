/**
 * Session Management Service
 * Complete checkout session lifecycle: CREATE → UPDATE → COMPLETE → CANCEL
 * Implements full ACP/UCP session management specs
 */

import {
  HaloSession,
  ACPCheckoutSession,
  ACPCheckoutCreateRequest,
  ACPCheckoutUpdateRequest,
  ACPCheckoutCompleteRequest,
  ACPCancelSessionRequest,
  ACPMessage,
  ACPTotal,
  ACPFulfillmentOption,
  Link,
  Buyer,
  Address,
} from '../types/protocols';

// In-memory session store (production would use Redis/DB)
const sessions = new Map<string, HaloSession>();

// Session TTL: 6 hours (per UCP spec)
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `halo_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate order ID
 */
function generateOrderId(): string {
  return `halo_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let cleaned = 0;
  
  sessions.forEach((session, id) => {
    if (new Date(session.expires_at).getTime() < now) {
      sessions.delete(id);
      cleaned++;
    }
  });
  
  return cleaned;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): HaloSession | null {
  const session = sessions.get(sessionId);
  
  if (!session) return null;
  
  // Check expiry
  if (new Date(session.expires_at).getTime() < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

/**
 * List all active sessions
 */
export function listSessions(): HaloSession[] {
  cleanupExpiredSessions();
  return Array.from(sessions.values());
}

/**
 * CREATE SESSION
 * POST /checkout - Create new checkout session
 */
export function createSession(
  request: ACPCheckoutCreateRequest,
  options: {
    agentProtocol: string;
    merchantProtocol: string;
    merchantContext?: any;
  }
): HaloSession {
  const now = new Date();
  const sessionId = generateSessionId();
  
  // Calculate totals from items
  const items = request.items.map((item, idx) => ({
    id: item.id || `item_${idx}`,
    name: `Item ${item.id}`,
    quantity: item.quantity,
    unit_price: 0, // Will be populated by product catalog
    total: 0,
  }));
  
  const session: HaloSession = {
    id: sessionId,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    status: 'active',
    
    agent_protocol: options.agentProtocol,
    merchant_protocol: options.merchantProtocol,
    
    checkout: {
      items,
      currency: 'USD',
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
    },
    
    buyer: request.buyer,
    shipping_address: request.fulfillment_details?.address,
    
    risk: {
      score: 0,
      decision: 'approve',
      factors: {},
    },
    
    metadata: {
      affiliate_attribution: request.affiliate_attribution,
      merchant_context: options.merchantContext,
    },
  };
  
  sessions.set(sessionId, session);
  console.log(`📦 [SessionManager] Created session: ${sessionId}`);
  
  return session;
}

/**
 * UPDATE SESSION
 * PATCH /checkout/:id - Update existing session
 */
export function updateSession(
  sessionId: string,
  request: ACPCheckoutUpdateRequest
): HaloSession | null {
  const session = getSession(sessionId);
  
  if (!session) {
    console.log(`❌ [SessionManager] Session not found: ${sessionId}`);
    return null;
  }
  
  if (session.status !== 'active') {
    console.log(`❌ [SessionManager] Cannot update ${session.status} session`);
    return null;
  }
  
  // Update buyer info
  if (request.buyer) {
    session.buyer = { ...session.buyer, ...request.buyer };
  }
  
  // Update fulfillment details
  if (request.fulfillment_details) {
    session.shipping_address = request.fulfillment_details.address;
  }
  
  // Update selected fulfillment option
  if (request.selected_fulfillment_options?.length) {
    const selected = request.selected_fulfillment_options[0];
    session.fulfillment = {
      type: selected.type,
      option_id: selected.shipping?.option_id || selected.digital?.option_id || '',
    };
  }
  
  // Update items if provided
  if (request.items) {
    session.checkout.items = request.items.map((item, idx) => ({
      id: item.id,
      name: `Item ${item.id}`,
      quantity: item.quantity,
      unit_price: session.checkout.items.find(i => i.id === item.id)?.unit_price || 0,
      total: 0,
    }));
  }
  
  session.updated_at = new Date().toISOString();
  sessions.set(sessionId, session);
  
  console.log(`✏️ [SessionManager] Updated session: ${sessionId}`);
  
  return session;
}

/**
 * COMPLETE SESSION
 * POST /checkout/:id/complete - Complete checkout with payment
 */
export async function completeSession(
  sessionId: string,
  request: ACPCheckoutCompleteRequest,
  paymentResult: any
): Promise<HaloSession | null> {
  const session = getSession(sessionId);
  
  if (!session) {
    console.log(`❌ [SessionManager] Session not found: ${sessionId}`);
    return null;
  }
  
  if (session.status !== 'active') {
    console.log(`❌ [SessionManager] Cannot complete ${session.status} session`);
    return null;
  }
  
  // Update buyer if provided
  if (request.buyer) {
    session.buyer = { ...session.buyer, ...request.buyer };
  }
  
  // Update affiliate attribution
  if (request.affiliate_attribution) {
    session.metadata.affiliate_attribution = request.affiliate_attribution;
  }
  
  // Set payment info
  session.payment = {
    status: paymentResult.success ? 'completed' : 'failed',
    method: request.payment_data.provider,
    transaction_id: paymentResult.transaction_id || paymentResult.id,
    amount: session.checkout.total,
    currency: session.checkout.currency,
    card_last4: paymentResult.card_last4,
    card_brand: paymentResult.card_brand,
  };
  
  if (paymentResult.success) {
    // Create order
    const orderId = generateOrderId();
    session.order = {
      id: orderId,
      permalink_url: `https://merchant.example.com/orders/${orderId}`,
      fulfillment_status: 'pending',
    };
    session.status = 'completed';
    console.log(`✅ [SessionManager] Completed session: ${sessionId}, Order: ${orderId}`);
  } else {
    console.log(`❌ [SessionManager] Payment failed for session: ${sessionId}`);
  }
  
  session.updated_at = new Date().toISOString();
  sessions.set(sessionId, session);
  
  return session;
}

/**
 * CANCEL SESSION
 * DELETE /checkout/:id - Cancel checkout session
 */
export function cancelSession(
  sessionId: string,
  request?: ACPCancelSessionRequest
): HaloSession | null {
  const session = getSession(sessionId);
  
  if (!session) {
    console.log(`❌ [SessionManager] Session not found: ${sessionId}`);
    return null;
  }
  
  if (session.status === 'completed') {
    console.log(`❌ [SessionManager] Cannot cancel completed session`);
    return null;
  }
  
  session.status = 'canceled';
  session.updated_at = new Date().toISOString();
  
  // Store intent trace for analytics
  if (request?.intent_trace) {
    session.metadata.cancellation = {
      reason_code: request.intent_trace.reason_code,
      trace_summary: request.intent_trace.trace_summary,
      metadata: request.intent_trace.metadata,
      canceled_at: new Date().toISOString(),
    };
    console.log(`🚫 [SessionManager] Canceled session: ${sessionId}, Reason: ${request.intent_trace.reason_code}`);
  } else {
    console.log(`🚫 [SessionManager] Canceled session: ${sessionId}`);
  }
  
  sessions.set(sessionId, session);
  
  return session;
}

/**
 * Mark session as requiring verification
 */
export function requireVerification(
  sessionId: string,
  riskScore: number,
  factors: Record<string, boolean>
): HaloSession | null {
  const session = getSession(sessionId);
  
  if (!session) return null;
  
  session.risk = {
    score: riskScore,
    decision: 'challenge',
    factors,
    verified: false,
  };
  
  session.updated_at = new Date().toISOString();
  sessions.set(sessionId, session);
  
  return session;
}

/**
 * Mark session as verified
 */
export function verifySession(
  sessionId: string,
  verificationMethod: string
): HaloSession | null {
  const session = getSession(sessionId);
  
  if (!session) return null;
  
  session.risk.verified = true;
  session.risk.verification_method = verificationMethod;
  session.updated_at = new Date().toISOString();
  sessions.set(sessionId, session);
  
  console.log(`✅ [SessionManager] Verified session: ${sessionId} via ${verificationMethod}`);
  
  return session;
}

/**
 * Convert HaloSession to ACP CheckoutSession format
 */
export function toACPCheckoutSession(session: HaloSession): ACPCheckoutSession {
  const lineItems = session.checkout.items.map(item => ({
    id: item.id,
    item: { id: item.id, quantity: item.quantity },
    name: item.name,
    unit_amount: item.unit_price,
    base_amount: item.unit_price * item.quantity,
    discount: 0,
    subtotal: item.unit_price * item.quantity,
    tax: Math.round(item.unit_price * item.quantity * 0.1),
    total: item.total,
  }));
  
  const messages: ACPMessage[] = [];
  
  // Add risk-based messages
  if (session.risk.decision === 'challenge' && !session.risk.verified) {
    messages.push({
      type: 'error',
      code: 'requires_3ds',
      content_type: 'plain',
      content: 'Additional verification required due to elevated risk signals.',
    });
  }
  
  const links: Link[] = [
    { type: 'terms_of_use', url: 'https://merchant.example.com/terms' },
    { type: 'privacy_policy', url: 'https://merchant.example.com/privacy' },
    { type: 'return_policy', url: 'https://merchant.example.com/returns' },
  ];
  
  const totals: ACPTotal[] = [
    { type: 'subtotal', display_text: 'Subtotal', amount: session.checkout.subtotal },
    { type: 'tax', display_text: 'Tax', amount: session.checkout.tax },
    { type: 'fulfillment', display_text: 'Shipping', amount: session.checkout.shipping },
    { type: 'total', display_text: 'Total', amount: session.checkout.total },
  ];
  
  // Map status
  let status: ACPCheckoutSession['status'];
  switch (session.status) {
    case 'active':
      status = session.risk.decision === 'challenge' && !session.risk.verified
        ? 'authentication_required'
        : 'ready_for_payment';
      break;
    case 'completed':
      status = 'completed';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    default:
      status = 'not_ready_for_payment';
  }
  
  return {
    id: session.id,
    status,
    currency: session.checkout.currency,
    buyer: session.buyer,
    line_items: lineItems,
    fulfillment_options: [], // Populated by FulfillmentService
    totals,
    messages,
    links,
    expires_at: session.expires_at,
    halo_session_id: session.id,
    halo_risk: {
      score: session.risk.score,
      decision: session.risk.decision,
      factors: session.risk.factors,
    },
    order: session.order ? {
      id: session.order.id,
      checkout_session_id: session.id,
      permalink_url: session.order.permalink_url,
    } : undefined,
  };
}

// Export session store for debugging
export const sessionStore = {
  get: getSession,
  list: listSessions,
  create: createSession,
  update: updateSession,
  complete: completeSession,
  cancel: cancelSession,
  verify: verifySession,
  cleanup: cleanupExpiredSessions,
  size: () => sessions.size,
};
