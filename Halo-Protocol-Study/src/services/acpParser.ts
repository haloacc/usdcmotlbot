import { ACPCheckoutSession } from '../types/index';

export interface ParsedACP {
  total_cents: number;
  currency: string;
  country: string;
  payment_provider: string;
  shipping_speed: string;
}

export function parseACP(checkoutSession: ACPCheckoutSession): ParsedACP {
    // Extract total from totals array (find entry with type='total')
    const totalEntry = checkoutSession.totals.find(t => t.type === 'total');
    const totalCents = totalEntry?.amount || 0;

    // Extract currency
    const currency = checkoutSession.currency;

    // Extract country from fulfillment_details
    const country = checkoutSession.fulfillment_details?.address?.country || 'US';

    // Extract payment provider
    const paymentProvider = checkoutSession.payment_provider.provider;

    // Determine shipping speed from selected fulfillment option
    let shippingSpeed = 'standard';
    if (checkoutSession.selected_fulfillment_options && checkoutSession.selected_fulfillment_options.length > 0) {
        const selectedOption = checkoutSession.selected_fulfillment_options[0];
        if (selectedOption.type === 'shipping') {
            const selectedId = selectedOption.shipping?.option_id;
            // Find the fulfillment option to determine if express
            const fulfillmentOpt = checkoutSession.fulfillment_options.find(f => f.id === selectedId);
            if (fulfillmentOpt && fulfillmentOpt.type === 'shipping') {
                // Check if title contains 'express', 'priority', 'fast', etc.
                const title = (fulfillmentOpt as any).title?.toLowerCase() || '';
                if (title.includes('express') || title.includes('priority') || title.includes('fast')) {
                    shippingSpeed = 'express';
                }
            }
        }
    }

    return {
        total_cents: totalCents,
        currency,
        country,
        payment_provider: paymentProvider,
        shipping_speed: shippingSpeed
    };
}