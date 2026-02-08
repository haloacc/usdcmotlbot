/**
 * Merchant Simulator Service
 * Simulates a merchant endpoint that receives ACP CREATE REQUEST
 * and returns an ACP CREATE RESPONSE
 * 
 * In production, this would be a real merchant endpoint
 * For MVP, we simulate the merchant response for demo purposes
 */

import { ACPCheckoutSession, ACPCreateRequest } from '../types/index';
import { lookupProduct } from './productCatalog';
import { generateSellerCapabilities, negotiateCapabilities, getDefaultAgentCapabilities } from './capabilityNegotiator';

export function merchantSimulateCheckoutResponse(
  request: ACPCreateRequest,
  itemName: string,
  amountCents: number,
  country: string,
  shippingSpeed: 'standard' | 'express'
): ACPCheckoutSession {
  // Look up real product details from catalog
  const product = lookupProduct(itemName);

  const checkoutId = `checkout_session_${generateId()}`;
  const lineItemId = `li_${generateId()}`;
  const shippingOptionStd = `fulfillment_option_${generateId()}`;
  const shippingOptionExp = `fulfillment_option_${generateId()}`;
  
  const quantity = request.items[0]?.quantity || 1;

  // Calculate tax (10% simple calculation)
  const tax_cents = Math.round(amountCents * 0.1);
  const subtotal_cents = amountCents;
  const lineitem_total_cents = subtotal_cents + tax_cents;

  // Fulfillment costs (example values)
  const standard_shipping_cents = 500; // $5
  const express_shipping_cents = 1500; // $15

  const selected_is_express = shippingSpeed === 'express';
  const selected_shipping_cost = selected_is_express
    ? express_shipping_cents
    : standard_shipping_cents;
  const total_cents = lineitem_total_cents + selected_shipping_cost;

  // Determine if high-risk transaction for capability negotiation
  const isHighValue = total_cents > 100000; // Over $1000
  const isInternational = country !== 'US';
  const isHighRisk = isHighValue || (isInternational && total_cents > 50000);

  // Generate seller capabilities based on transaction context
  const sellerCapabilities = generateSellerCapabilities({
    requiresAuth: isHighRisk,
    supportsWallets: true,
    supportsBNPL: total_cents > 10000, // BNPL for purchases over $100
    highRisk: isHighRisk
  });

  // Negotiate capabilities if agent provided them
  let sessionStatus: ACPCheckoutSession['status'] = 'ready_for_payment';
  let messages: ACPCheckoutSession['messages'] = [];

  if (request.agent_capabilities) {
    const negotiationResult = negotiateCapabilities(
      request.agent_capabilities,
      sellerCapabilities
    );

    if (!negotiationResult.compatible) {
      sessionStatus = 'not_ready_for_payment';
    } else {
      sessionStatus = negotiationResult.status;
    }

    messages = negotiationResult.messages;
  }

  return {
    id: checkoutId,
    status: sessionStatus,
    currency: 'usd',
    payment_provider: {
      provider: 'stripe',
      supported_payment_methods: [
        {
          type: 'card',
          supported_card_networks: ['amex', 'discover', 'mastercard', 'visa'],
        },
      ],
    },
    seller_capabilities: sellerCapabilities, // Schema 2: Capability Negotiation
    messages, // Include any compatibility messages

    line_items: [
      {
        id: lineItemId,
        item: {
          id: request.items[0].id,
          quantity: quantity,
        },
        base_amount: amountCents,
        discount: 0,
        subtotal: subtotal_cents,
        tax: tax_cents,
        total: lineitem_total_cents,
        name: product.name,
        description: product.description || `${quantity} × ${product.name}`,
        unit_amount: Math.round(amountCents / quantity),
        images: product.image ? [product.image] : [],
        custom_attributes: [],
        disclosures: [],
      },
    ],

    totals: [
      {
        type: 'items_base_amount',
        display_text: "Item(s) total",
        amount: amountCents,
      },
      {
        type: 'subtotal',
        display_text: 'Subtotal',
        amount: subtotal_cents,
      },
      {
        type: 'tax',
        display_text: 'Tax',
        amount: tax_cents,
      },
      {
        type: 'fulfillment',
        display_text: selected_is_express ? 'Express Shipping' : 'Standard Shipping',
        amount: selected_shipping_cost,
      },
      {
        type: 'total',
        display_text: 'Total',
        amount: total_cents,
      },
    ],

    fulfillment_options: [
      {
        type: 'shipping',
        id: shippingOptionStd,
        title: 'Standard',
        subtitle: 'Arrives in 4-5 days',
        carrier: 'USPS',
        subtotal: standard_shipping_cents,
        tax: 0,
        total: standard_shipping_cents,
      },
      {
        type: 'shipping',
        id: shippingOptionExp,
        title: 'Express',
        subtitle: 'Arrives in 1-2 days',
        carrier: 'FedEx',
        subtotal: express_shipping_cents,
        tax: 0,
        total: express_shipping_cents,
      },
    ],

    selected_fulfillment_options: [
      {
        type: 'shipping',
        shipping: {
          option_id: selected_is_express ? shippingOptionExp : shippingOptionStd,
          item_ids: [request.items[0].id],
        },
      },
    ],

    fulfillment_details: {
      name: 'Customer',
      phone_number: '15551234567',
      email: 'customer@example.com',
      address: {
        name: 'Customer',
        line_one: '1234 Main St',
        city: 'San Francisco',
        state: country === 'US' ? 'CA' : '',
        country: country || 'US',
        postal_code: '94131',
      },
    },

    links: [
      {
        type: 'terms_of_use',
        url: 'https://example.com/terms',
      },
      {
        type: 'return_policy',
        url: 'https://example.com/returns',
      },
    ],
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
