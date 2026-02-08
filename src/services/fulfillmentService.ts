/**
 * Fulfillment Service
 * Handles shipping options, delivery estimates, digital delivery
 * Implements ACP FulfillmentOption* and UCP fulfillment specs
 */

import {
  ACPFulfillmentOption,
  ACPFulfillmentOptionShipping,
  ACPFulfillmentOptionDigital,
  ACPSelectedFulfillmentOption,
  Address,
} from '../types/protocols';

// Shipping carriers
const CARRIERS = {
  USPS: 'USPS',
  UPS: 'UPS',
  FEDEX: 'FedEx',
  DHL: 'DHL',
};

// Base shipping rates (in cents)
const SHIPPING_RATES = {
  standard: { base: 599, perItem: 100, days: [5, 7] },
  express: { base: 1299, perItem: 200, days: [2, 3] },
  overnight: { base: 2499, perItem: 400, days: [1, 1] },
  economy: { base: 399, perItem: 50, days: [7, 14] },
};

// International shipping multipliers
const COUNTRY_MULTIPLIERS: Record<string, number> = {
  US: 1.0,
  CA: 1.5,
  MX: 1.8,
  GB: 2.0,
  DE: 2.0,
  FR: 2.0,
  JP: 2.5,
  AU: 2.5,
  IN: 2.2,
  DEFAULT: 3.0,
};

/**
 * Calculate delivery date range
 */
function calculateDeliveryDates(daysRange: [number, number]): { earliest: string; latest: string } {
  const now = new Date();
  const earliest = new Date(now);
  earliest.setDate(earliest.getDate() + daysRange[0]);
  const latest = new Date(now);
  latest.setDate(latest.getDate() + daysRange[1]);
  
  return {
    earliest: earliest.toISOString(),
    latest: latest.toISOString(),
  };
}

/**
 * Calculate shipping cost based on destination and items
 */
function calculateShippingCost(
  tier: keyof typeof SHIPPING_RATES,
  itemCount: number,
  country: string = 'US'
): number {
  const rate = SHIPPING_RATES[tier];
  const multiplier = COUNTRY_MULTIPLIERS[country] || COUNTRY_MULTIPLIERS.DEFAULT;
  
  const baseCost = rate.base + (rate.perItem * itemCount);
  return Math.round(baseCost * multiplier);
}

/**
 * Get available shipping options for an address
 */
export function getShippingOptions(
  address: Address | undefined,
  items: Array<{ id: string; quantity: number }>,
  totalAmountCents: number
): ACPFulfillmentOptionShipping[] {
  const country = address?.country || 'US';
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const options: ACPFulfillmentOptionShipping[] = [];
  
  // Standard Shipping
  const standardDates = calculateDeliveryDates(SHIPPING_RATES.standard.days as [number, number]);
  const standardCost = calculateShippingCost('standard', itemCount, country);
  options.push({
    type: 'shipping',
    id: 'shipping_standard',
    title: 'Standard Shipping',
    subtitle: `Arrives ${new Date(standardDates.earliest).toLocaleDateString()} - ${new Date(standardDates.latest).toLocaleDateString()}`,
    carrier: CARRIERS.USPS,
    earliest_delivery_time: standardDates.earliest,
    latest_delivery_time: standardDates.latest,
    subtotal: standardCost,
    tax: Math.round(standardCost * 0.1),
    total: Math.round(standardCost * 1.1),
  });
  
  // Express Shipping
  const expressDates = calculateDeliveryDates(SHIPPING_RATES.express.days as [number, number]);
  const expressCost = calculateShippingCost('express', itemCount, country);
  options.push({
    type: 'shipping',
    id: 'shipping_express',
    title: 'Express Shipping',
    subtitle: `Arrives ${new Date(expressDates.earliest).toLocaleDateString()} - ${new Date(expressDates.latest).toLocaleDateString()}`,
    carrier: CARRIERS.UPS,
    earliest_delivery_time: expressDates.earliest,
    latest_delivery_time: expressDates.latest,
    subtotal: expressCost,
    tax: Math.round(expressCost * 0.1),
    total: Math.round(expressCost * 1.1),
  });
  
  // Overnight Shipping (only for domestic or high-value orders)
  if (country === 'US' || totalAmountCents > 10000) {
    const overnightDates = calculateDeliveryDates(SHIPPING_RATES.overnight.days as [number, number]);
    const overnightCost = calculateShippingCost('overnight', itemCount, country);
    options.push({
      type: 'shipping',
      id: 'shipping_overnight',
      title: 'Overnight Shipping',
      subtitle: `Arrives ${new Date(overnightDates.earliest).toLocaleDateString()}`,
      carrier: CARRIERS.FEDEX,
      earliest_delivery_time: overnightDates.earliest,
      latest_delivery_time: overnightDates.latest,
      subtotal: overnightCost,
      tax: Math.round(overnightCost * 0.1),
      total: Math.round(overnightCost * 1.1),
    });
  }
  
  // Economy Shipping (for low-value international)
  if (country !== 'US') {
    const economyDates = calculateDeliveryDates(SHIPPING_RATES.economy.days as [number, number]);
    const economyCost = calculateShippingCost('economy', itemCount, country);
    options.push({
      type: 'shipping',
      id: 'shipping_economy',
      title: 'Economy International',
      subtitle: `Arrives ${new Date(economyDates.earliest).toLocaleDateString()} - ${new Date(economyDates.latest).toLocaleDateString()}`,
      carrier: CARRIERS.DHL,
      earliest_delivery_time: economyDates.earliest,
      latest_delivery_time: economyDates.latest,
      subtotal: economyCost,
      tax: Math.round(economyCost * 0.1),
      total: Math.round(economyCost * 1.1),
    });
  }
  
  // Free shipping for orders over $100
  if (totalAmountCents >= 10000) {
    const freeDates = calculateDeliveryDates([5, 10]);
    options.unshift({
      type: 'shipping',
      id: 'shipping_free',
      title: 'Free Standard Shipping',
      subtitle: `Arrives ${new Date(freeDates.earliest).toLocaleDateString()} - ${new Date(freeDates.latest).toLocaleDateString()}`,
      carrier: CARRIERS.USPS,
      earliest_delivery_time: freeDates.earliest,
      latest_delivery_time: freeDates.latest,
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  }
  
  return options;
}

/**
 * Get digital delivery options
 */
export function getDigitalDeliveryOptions(
  items: Array<{ id: string; name: string }>
): ACPFulfillmentOptionDigital[] {
  return [
    {
      type: 'digital',
      id: 'digital_instant',
      title: 'Instant Digital Delivery',
      subtitle: 'Download link sent immediately after purchase',
      subtotal: 0,
      tax: 0,
      total: 0,
    },
    {
      type: 'digital',
      id: 'digital_email',
      title: 'Email Delivery',
      subtitle: 'Sent to your email within 5 minutes',
      subtotal: 0,
      tax: 0,
      total: 0,
    },
  ];
}

/**
 * Get all fulfillment options based on product type
 */
export function getFulfillmentOptions(
  items: Array<{ id: string; name: string; quantity: number; is_digital?: boolean }>,
  address?: Address,
  totalAmountCents: number = 0
): ACPFulfillmentOption[] {
  const hasDigital = items.some(item => item.is_digital);
  const hasPhysical = items.some(item => !item.is_digital);
  
  const options: ACPFulfillmentOption[] = [];
  
  if (hasPhysical) {
    options.push(...getShippingOptions(address, items, totalAmountCents));
  }
  
  if (hasDigital) {
    options.push(...getDigitalDeliveryOptions(items));
  }
  
  return options;
}

/**
 * Validate selected fulfillment option
 */
export function validateFulfillmentSelection(
  selected: ACPSelectedFulfillmentOption,
  availableOptions: ACPFulfillmentOption[]
): { valid: boolean; error?: string } {
  const optionId = selected.type === 'shipping' 
    ? selected.shipping?.option_id 
    : selected.digital?.option_id;
  
  const option = availableOptions.find(opt => opt.id === optionId);
  
  if (!option) {
    return { 
      valid: false, 
      error: `Fulfillment option '${optionId}' is not available` 
    };
  }
  
  if (option.type !== selected.type) {
    return { 
      valid: false, 
      error: `Option '${optionId}' is ${option.type}, not ${selected.type}` 
    };
  }
  
  return { valid: true };
}

/**
 * Calculate shipping for selected option
 */
export function getSelectedShippingCost(
  optionId: string,
  options: ACPFulfillmentOption[]
): number {
  const option = options.find(opt => opt.id === optionId);
  return option?.total || 0;
}

/**
 * Generate tracking number (mock)
 */
export function generateTrackingNumber(carrier: string): string {
  const prefix = {
    [CARRIERS.USPS]: '9400',
    [CARRIERS.UPS]: '1Z',
    [CARRIERS.FEDEX]: '7489',
    [CARRIERS.DHL]: 'JD01',
  }[carrier] || 'TRK';
  
  const suffix = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Generate tracking URL
 */
export function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const urls: Record<string, string> = {
    [CARRIERS.USPS]: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    [CARRIERS.UPS]: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    [CARRIERS.FEDEX]: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    [CARRIERS.DHL]: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  
  return urls[carrier] || `https://track.example.com/${trackingNumber}`;
}

// Export for use in other services
export const fulfillmentService = {
  getShippingOptions,
  getDigitalDeliveryOptions,
  getFulfillmentOptions,
  validateFulfillmentSelection,
  getSelectedShippingCost,
  generateTrackingNumber,
  generateTrackingUrl,
  CARRIERS,
  SHIPPING_RATES,
};
