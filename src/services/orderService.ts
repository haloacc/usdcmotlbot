/**
 * Order Management Service
 * Handles order creation, tracking, fulfillment events, refunds
 * Implements full ACP/UCP order lifecycle
 */

import {
  ACPOrder,
  UCPOrder,
  UCPFulfillmentExpectation,
  UCPFulfillmentEvent,
  UCPAdjustment,
  HaloSession,
} from '../types/protocols';
import { fulfillmentService } from './fulfillmentService';

// In-memory order store
const orders = new Map<string, Order>();

interface OrderLineItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Order {
  id: string;
  checkout_id: string;
  created_at: string;
  updated_at: string;
  
  // Core order data
  line_items: OrderLineItem[];
  currency: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  
  // Customer info
  buyer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  shipping_address?: {
    name: string;
    line_one: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  
  // Fulfillment
  fulfillment: {
    type: 'shipping' | 'digital';
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
    expectations: UCPFulfillmentExpectation[];
    events: UCPFulfillmentEvent[];
  };
  
  // Payment
  payment: {
    status: 'paid' | 'refunded' | 'partial_refund';
    transaction_id: string;
    method: string;
  };
  
  // Adjustments (refunds, returns, etc.)
  adjustments: UCPAdjustment[];
  
  // URLs
  permalink_url: string;
  
  // Metadata
  metadata: Record<string, any>;
}

/**
 * Generate order ID
 */
function generateOrderId(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create order from completed session
 */
export function createOrder(session: HaloSession): Order {
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  
  // Get carrier from fulfillment option
  const carrier = session.fulfillment?.carrier || 'USPS';
  const trackingNumber = fulfillmentService.generateTrackingNumber(carrier);
  
  // Calculate expected delivery
  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 5);
  
  const order: Order = {
    id: orderId,
    checkout_id: session.id,
    created_at: now,
    updated_at: now,
    
    line_items: session.checkout.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })),
    currency: session.checkout.currency,
    subtotal: session.checkout.subtotal,
    tax: session.checkout.tax,
    shipping: session.checkout.shipping,
    total: session.checkout.total,
    
    buyer: {
      first_name: session.buyer?.first_name || 'Guest',
      last_name: session.buyer?.last_name || 'User',
      email: session.buyer?.email || 'guest@example.com',
    },
    shipping_address: session.shipping_address ? {
      name: session.shipping_address.name,
      line_one: session.shipping_address.line_one,
      city: session.shipping_address.city,
      state: session.shipping_address.state,
      country: session.shipping_address.country,
      postal_code: session.shipping_address.postal_code,
    } : undefined,
    
    fulfillment: {
      type: session.fulfillment?.type || 'shipping',
      status: 'pending',
      expectations: [
        {
          id: `exp_${orderId}_1`,
          type: session.fulfillment?.type || 'shipping',
          line_item_ids: session.checkout.items.map(i => i.id),
          expected_date: expectedDelivery.toISOString(),
          carrier,
          tracking_number: trackingNumber,
        },
      ],
      events: [],
    },
    
    payment: {
      status: 'paid',
      transaction_id: session.payment?.transaction_id || '',
      method: session.payment?.method || 'card',
    },
    
    adjustments: [],
    
    permalink_url: `https://merchant.example.com/orders/${orderId}`,
    
    metadata: {
      agent_protocol: session.agent_protocol,
      merchant_protocol: session.merchant_protocol,
      halo_session_id: session.id,
    },
  };
  
  orders.set(orderId, order);
  console.log(`📦 [OrderManager] Created order: ${orderId}`);
  
  return order;
}

/**
 * Get order by ID
 */
export function getOrder(orderId: string): Order | null {
  return orders.get(orderId) || null;
}

/**
 * Get order by checkout session ID
 */
export function getOrderByCheckoutId(checkoutId: string): Order | null {
  for (const order of orders.values()) {
    if (order.checkout_id === checkoutId) {
      return order;
    }
  }
  return null;
}

/**
 * List all orders
 */
export function listOrders(filters?: {
  status?: string;
  buyer_email?: string;
}): Order[] {
  let result = Array.from(orders.values());
  
  if (filters?.status) {
    result = result.filter(o => o.fulfillment.status === filters.status);
  }
  
  if (filters?.buyer_email) {
    result = result.filter(o => o.buyer.email === filters.buyer_email);
  }
  
  return result.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Add fulfillment event (shipped, delivered, etc.)
 */
export function addFulfillmentEvent(
  orderId: string,
  event: {
    type: 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'failed_attempt' | 'canceled' | 'undeliverable' | 'returned_to_sender';
    line_items?: Array<{ id: string; quantity: number }>;
    carrier?: string;
    tracking_number?: string;
    description?: string;
  }
): Order | null {
  const order = orders.get(orderId);
  if (!order) return null;
  
  const eventId = `evt_${orderId}_${order.fulfillment.events.length + 1}`;
  const now = new Date().toISOString();
  
  // Build line_items array - use provided or default to all items
  const lineItems = event.line_items || order.line_items.map(i => ({ 
    id: i.id, 
    quantity: i.quantity 
  }));
  
  const fulfillmentEvent: UCPFulfillmentEvent = {
    id: eventId,
    type: event.type,
    occurred_at: now,
    line_items: lineItems,
    carrier: event.carrier,
    tracking_number: event.tracking_number,
    tracking_url: event.carrier && event.tracking_number
      ? fulfillmentService.generateTrackingUrl(event.carrier, event.tracking_number)
      : undefined,
    description: event.description,
  };
  
  order.fulfillment.events.push(fulfillmentEvent);
  
  // Update fulfillment status based on event
  switch (event.type) {
    case 'processing':
      order.fulfillment.status = 'processing';
      break;
    case 'shipped':
    case 'in_transit':
      order.fulfillment.status = 'shipped';
      break;
    case 'delivered':
      order.fulfillment.status = 'delivered';
      break;
    case 'canceled':
    case 'undeliverable':
    case 'returned_to_sender':
      order.fulfillment.status = 'canceled';
      break;
    case 'failed_attempt':
      // Keep current status
      break;
  }
  
  order.updated_at = now;
  orders.set(orderId, order);
  
  console.log(`📬 [OrderManager] Added ${event.type} event to order: ${orderId}`);
  
  return order;
}

/**
 * Process refund
 */
export function processRefund(
  orderId: string,
  refund: {
    type: 'refund' | 'return' | 'credit' | 'price_adjustment' | 'dispute' | 'cancellation';
    amount?: number;
    description?: string;
    line_items?: Array<{ id: string; quantity: number }>;
    status?: 'pending' | 'completed' | 'failed';
  }
): Order | null {
  const order = orders.get(orderId);
  if (!order) return null;
  
  const adjustmentId = `adj_${orderId}_${order.adjustments.length + 1}`;
  const now = new Date().toISOString();
  
  // Build line_items if provided as just IDs
  const lineItems = refund.line_items;
  
  const adjustment: UCPAdjustment = {
    id: adjustmentId,
    type: refund.type,
    occurred_at: now,
    status: refund.status || 'completed',
    amount: refund.amount,
    description: refund.description,
    line_items: lineItems,
  };
  
  order.adjustments.push(adjustment);
  
  // Calculate total refunded (only count adjustments with amount and completed status)
  const totalRefunded = order.adjustments
    .filter(a => ['refund', 'return', 'credit'].includes(a.type) && a.amount && a.status === 'completed')
    .reduce((sum, a) => sum + (a.amount || 0), 0);
  
  // Update payment status
  if (totalRefunded >= order.total) {
    order.payment.status = 'refunded';
  } else if (totalRefunded > 0) {
    order.payment.status = 'partial_refund';
  }
  
  order.updated_at = now;
  orders.set(orderId, order);
  
  console.log(`💸 [OrderManager] Processed ${refund.type} for order: ${orderId}, Amount: ${refund.amount}`);
  
  return order;
}

/**
 * Cancel order
 */
export function cancelOrder(orderId: string, reason?: string): Order | null {
  const order = orders.get(orderId);
  if (!order) return null;
  
  // Can only cancel pending or processing orders
  if (!['pending', 'processing'].includes(order.fulfillment.status)) {
    console.log(`❌ [OrderManager] Cannot cancel ${order.fulfillment.status} order`);
    return null;
  }
  
  // Add cancellation event
  addFulfillmentEvent(orderId, { type: 'canceled' });
  
  // Process full refund
  processRefund(orderId, {
    type: 'cancellation',
    amount: order.total,
    description: reason || 'Order canceled',
  });
  
  console.log(`🚫 [OrderManager] Canceled order: ${orderId}`);
  
  return orders.get(orderId) || null;
}

/**
 * Convert to ACP Order format
 */
export function toACPOrder(order: Order): ACPOrder {
  return {
    id: order.id,
    checkout_session_id: order.checkout_id,
    permalink_url: order.permalink_url,
  };
}

/**
 * Convert to UCP Order format (official spec)
 */
export function toUCPOrder(order: Order): UCPOrder {
  // Calculate fulfilled quantities from events
  const fulfilledQuantities: Record<string, number> = {};
  for (const event of order.fulfillment.events) {
    if (event.type === 'delivered') {
      for (const li of event.line_items) {
        fulfilledQuantities[li.id] = (fulfilledQuantities[li.id] || 0) + li.quantity;
      }
    }
  }
  
  return {
    ucp: {
      schema: 'dev.ucp.shopping.order',
      version: '2026-01-11',
    },
    id: order.id,
    checkout_id: order.checkout_id,
    permalink_url: order.permalink_url,
    line_items: order.line_items.map(item => {
      const fulfilled = fulfilledQuantities[item.id] || 0;
      const total = item.quantity;
      // Derive status: fulfilled if all delivered, partial if some, else processing
      const status: 'processing' | 'partial' | 'fulfilled' = 
        fulfilled >= total ? 'fulfilled' : 
        fulfilled > 0 ? 'partial' : 'processing';
      
      return {
        id: item.id,
        item: {
          id: item.id,
          title: item.name,
          price: item.unit_price,
        },
        quantity: {
          total,
          fulfilled,
        },
        totals: [
          { type: 'subtotal' as const, label: 'Subtotal', amount: item.total },
        ],
        status,
      };
    }),
    fulfillment: {
      expectations: order.fulfillment.expectations,
      events: order.fulfillment.events,
    },
    adjustments: order.adjustments,
    totals: [
      { type: 'subtotal', label: 'Subtotal', amount: order.subtotal },
      { type: 'shipping', label: 'Shipping', amount: order.shipping },
      { type: 'tax', label: 'Tax', amount: order.tax },
      { type: 'total', label: 'Total', amount: order.total },
    ],
  };
}

/**
 * Simulate order progression (for demo)
 */
export async function simulateOrderProgression(orderId: string): Promise<void> {
  const order = orders.get(orderId);
  if (!order) return;
  
  // Simulate processing -> shipped -> delivered
  console.log(`🔄 [OrderManager] Simulating progression for order: ${orderId}`);
  
  // After 2 seconds: mark as processing
  setTimeout(() => {
    const o = orders.get(orderId);
    if (o && o.fulfillment.status === 'pending') {
      o.fulfillment.status = 'processing';
      o.updated_at = new Date().toISOString();
      orders.set(orderId, o);
      console.log(`📦 [OrderManager] Order ${orderId} now processing`);
    }
  }, 2000);
  
  // After 5 seconds: mark as shipped
  setTimeout(() => {
    addFulfillmentEvent(orderId, {
      type: 'shipped',
      carrier: order.fulfillment.expectations[0]?.carrier || 'USPS',
      tracking_number: order.fulfillment.expectations[0]?.tracking_number,
    });
  }, 5000);
  
  // After 10 seconds: mark as delivered
  setTimeout(() => {
    addFulfillmentEvent(orderId, { type: 'delivered' });
  }, 10000);
}

// Export service
export const orderService = {
  create: createOrder,
  get: getOrder,
  getByCheckoutId: getOrderByCheckoutId,
  list: listOrders,
  addFulfillmentEvent,
  processRefund,
  cancel: cancelOrder,
  toACPOrder,
  toUCPOrder,
  simulateProgression: simulateOrderProgression,
  count: () => orders.size,
};
