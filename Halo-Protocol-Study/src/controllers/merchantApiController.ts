/**
 * Merchant API Controller
 * Simulates a MERCHANT SERVER that exposes protocol-compliant endpoints
 * 
 * In production, this would be a separate merchant service (e.g., CyberShop.com)
 * For MVP, we simulate merchant responses following ACP/UCP schemas
 * 
 * Merchant Endpoints:
 * - GET  /merchant/catalog - Product catalog (protocol-compliant)
 * - POST /merchant/cart - Create/update cart (protocol-compliant)
 * - GET  /merchant/cart/:id - Retrieve cart
 * - POST /merchant/checkout - Create checkout session (ACP)
 * - POST /merchant/payment - Process payment (ACP)
 */

import { Request, Response } from 'express';
import { ACPCheckoutSession } from '../types/index';

// In-memory storage (production would use database)
const carts = new Map<string, any>();
const orders = new Map<string, any>();

export class MerchantApiController {
  /**
   * GET /merchant/catalog
   * Returns product catalog in protocol-compliant format
   */
  public getCatalog = async (req: Request, res: Response): Promise<void> => {
    try {
      const catalog = {
        merchant: {
          id: 'cybershop_demo',
          name: 'CyberShop',
          description: 'Premium Electronics & Gadgets',
          logo_url: 'https://example.com/logo.png',
        },
        products: [
          {
            id: 'laptop_001',
            name: 'Gaming Laptop Pro',
            description: 'Ultra-slim high-performance gaming laptop with an RTX 4080, custom RGB mechanical keyboard, and breathtaking 240Hz display.',
            price: { amount: 1500, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'computers'],
            metadata: {
              brand: 'TechPro',
              warranty: '2 years',
            },
          },
          {
            id: 'headphones_001',
            name: 'Wireless Studio Edge',
            description: 'Professional-grade noise-canceling wireless headphones. Experience pure audio clarity with 40h battery life and leather ear cushions.',
            price: { amount: 299, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'audio'],
            metadata: {
              brand: 'AudioMax',
              warranty: '1 year',
            },
          },
          {
            id: 'watch_001',
            name: 'Smart Watch Horizon',
            description: 'Advanced fitness and health tracking smartwatch with a sapphire glass face and stainless steel band. Water resistant up to 50m.',
            price: { amount: 399, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'wearables'],
            metadata: {
              brand: 'TechWear',
              warranty: '1 year',
            },
          },
          {
            id: 'keyboard_001',
            name: 'KeyMaster RGB Mechanical',
            description: 'High-tactile mechanical keyboard with brushed aluminum top plate and custom programmable RGB lighting presets.',
            price: { amount: 149, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'peripherals'],
            metadata: {
              brand: 'KeyMaster',
              warranty: '2 years',
            },
          },
          {
            id: 'webcam_001',
            name: 'Vision 4K Streamer',
            description: 'Broadcast-quality 4K webcam with auto-focus and low-light optimization. Perfect for professional streaming and calls.',
            price: { amount: 129, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'peripherals'],
            metadata: {
              brand: 'VisionTech',
              warranty: '1 year',
            },
          },
          {
            id: 'ssd_001',
            name: 'Portable SSD 2TB Ultra',
            description: 'Ultra-fast NVMe portable SSD with 2TB storage. Military-grade shock resistance and blazing fast 2000MB/s speeds.',
            price: { amount: 189, currency: 'USD' },
            images: ['https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?auto=format&fit=crop&q=80&w=800'],
            in_stock: true,
            categories: ['electronics', 'storage'],
            metadata: {
              brand: 'DataStore',
              warranty: '3 years',
            },
          },
        ],
        capabilities: {
          supports_cart: true,
          supports_wishlists: false,
          supports_reviews: false,
          payment_methods: ['card', 'wallet'],
          currencies: ['USD', 'EUR', 'GBP'],
          shipping_countries: ['US', 'CA', 'UK', 'EU'],
        },
      };

      res.json(catalog);
    } catch (error: any) {
      console.error('[MerchantAPI] Catalog error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /merchant/cart
   * Create or update cart (protocol-compliant)
   */
  public updateCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cart_id, items, buyer_id } = req.body;

      const cartId = cart_id || `cart_${Date.now()}`;

      const cart = {
        id: cartId,
        buyer_id: buyer_id || 'guest',
        items: items || [],
        created_at: carts.has(cartId) ? carts.get(cartId).created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        totals: this.calculateCartTotals(items || []),
      };

      carts.set(cartId, cart);

      res.json({
        success: true,
        cart,
      });
    } catch (error: any) {
      console.error('[MerchantAPI] Cart update error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /merchant/cart/:id
   * Retrieve cart by ID
   */
  public getCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cart = carts.get(id);
      if (!cart) {
        res.status(404).json({ error: 'Cart not found' });
        return;
      }

      res.json({
        success: true,
        cart,
      });
    } catch (error: any) {
      console.error('[MerchantAPI] Cart retrieval error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /merchant/checkout
   * Create checkout session (ACP CREATE REQUEST → RESPONSE)
   */
  public createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cart_id, items, payment_method_types, success_url, cancel_url } = req.body;

      // Get cart if cart_id provided
      let cartItems = items;
      if (cart_id) {
        const cart = carts.get(cart_id);
        if (cart) {
          cartItems = cart.items;
        }
      }

      if (!cartItems || cartItems.length === 0) {
        res.status(400).json({ error: 'No items in cart' });
        return;
      }

      // Generate checkout session (ACP format)
      const checkoutId = `checkout_${Date.now()}`;
      const totals = this.calculateCartTotals(cartItems);

      const checkoutSession: Partial<ACPCheckoutSession> = {
        id: checkoutId,
        status: 'ready_for_payment',
        currency: 'usd',
        payment_provider: {
          provider: 'stripe',
          supported_payment_methods: [
            {
              type: 'card',
              supported_card_networks: ['visa', 'mastercard', 'amex', 'discover'],
            },
          ],
        },
        seller_capabilities: {
          payment_methods: ['card'],
          supported_wallets: ['apple_pay', 'google_pay'],
          bnpl_available: totals.total.amount > 100,
        } as any, // Simplified for demo
        line_items: cartItems.map((item: any, idx: number) => ({
          id: `li_${idx}`,
          item: {
            id: item.product_id,
            quantity: item.quantity,
          },
          unit_price: {
            amount: item.price,
            currency: 'usd',
          },
          total: {
            amount: item.price * item.quantity,
            currency: 'usd',
          },
        })),
        totals: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
        } as any, // Simplified totals structure
        messages: [],
      };

      res.json({
        success: true,
        checkout_session: checkoutSession,
      });
    } catch (error: any) {
      console.error('[MerchantAPI] Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /merchant/payment
   * Process payment (ACP PAYMENT REQUEST → COMPLETION RESPONSE)
   */
  public processPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { checkout_session_id, payment_method, billing_address } = req.body;

      if (!checkout_session_id || !payment_method) {
        res.status(400).json({ error: 'checkout_session_id and payment_method required' });
        return;
      }

      // Simulate payment processing
      const orderId = `order_${Date.now()}`;
      const paymentId = `pi_${Date.now()}`;

      const order = {
        id: orderId,
        status: 'confirmed',
        checkout_session_id,
        payment_id: paymentId,
        created_at: new Date().toISOString(),
      };

      orders.set(orderId, order);

      // Return ACP COMPLETION RESPONSE
      const completionResponse = {
        id: checkout_session_id,
        status: 'completed',
        order: {
          id: orderId,
          status: 'confirmed',
          permalink_url: `https://cybershop.example.com/orders/${orderId}`,
          receipt_url: `https://cybershop.example.com/receipts/${orderId}`,
        },
        payment: {
          id: paymentId,
          status: 'succeeded',
          amount: { value: 1500, currency: 'usd' }, // Would be actual amount
          payment_method: {
            type: payment_method.type,
            brand: payment_method.brand || 'visa',
            last4: payment_method.last4 || '4242',
          },
          created_at: new Date().toISOString(),
        },
        fulfillment: {
          status: 'pending',
          expectations: [
            {
              type: 'shipping',
              window: {
                start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              tracking_available: false,
            },
          ],
        },
      };

      res.json({
        success: true,
        completion: completionResponse,
      });
    } catch (error: any) {
      console.error('[MerchantAPI] Payment error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Helper: Calculate cart totals
   */
  private calculateCartTotals(items: any[]) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const shipping = 25; // Flat shipping
    const total = subtotal + tax + shipping;

    return {
      subtotal: { amount: subtotal, currency: 'usd' },
      tax: { amount: tax, currency: 'usd' },
      shipping: { amount: shipping, currency: 'usd' },
      total: { amount: total, currency: 'usd' },
    };
  }
}

export default new MerchantApiController();
