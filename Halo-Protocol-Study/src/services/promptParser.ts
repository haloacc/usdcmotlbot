/**
 * Prompt Parser Service
 * Converts natural language prompts into structured payment data
 * Example: "Buy $100 Nike shoes from Nike with express shipping"
 */

export interface ParsedPrompt {
  amount_cents: number; // in smallest unit (cents, paise, etc.)
  item_name: string;
  shipping_speed: 'standard' | 'express';
  country: string; // ISO-3166-1 alpha-2
  quantity: number;
  currency: string; // ISO currency code (USD, INR, EUR, etc.)
  merchant?: string; // Optional merchant name
}

// Currency patterns and their ISO codes
const CURRENCY_PATTERNS: { pattern: RegExp; code: string; symbol?: string }[] = [
  { pattern: /\$\s*([\d,]+(?:\.\d{2})?)/i, code: 'USD', symbol: '$' },
  { pattern: /([\d,]+(?:\.\d{2})?)\s*(?:dollars?|usd|bucks?)/i, code: 'USD' },
  { pattern: /₹\s*([\d,]+(?:\.\d{2})?)/i, code: 'INR', symbol: '₹' },
  { pattern: /([\d,]+(?:\.\d{2})?)\s*(?:rupees?|inr|rs\.?)/i, code: 'INR' },
  { pattern: /€\s*([\d,]+(?:\.\d{2})?)/i, code: 'EUR', symbol: '€' },
  { pattern: /([\d,]+(?:\.\d{2})?)\s*(?:euros?|eur)/i, code: 'EUR' },
  { pattern: /£\s*([\d,]+(?:\.\d{2})?)/i, code: 'GBP', symbol: '£' },
  { pattern: /([\d,]+(?:\.\d{2})?)\s*(?:pounds?|gbp|quid)/i, code: 'GBP' },
  { pattern: /¥\s*([\d,]+(?:\.\d{2})?)/i, code: 'JPY', symbol: '¥' },
  { pattern: /([\d,]+(?:\.\d{2})?)\s*(?:yen|jpy)/i, code: 'JPY' },
];

export function parsePrompt(prompt: string): ParsedPrompt {
  // ===== STEP 1: Extract Amount and Currency =====
  let amount = 0;
  let currency = 'USD'; // default

  // First try specific currency patterns
  for (const { pattern, code } of CURRENCY_PATTERNS) {
    const match = prompt.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      currency = code;
      break;
    }
  }

  // If no currency found, look for plain numbers (assume USD)
  if (amount === 0) {
    const plainNumberMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+(\d+(?:\.\d{2})?)\s+/i);
    if (plainNumberMatch) {
      amount = parseFloat(plainNumberMatch[1]);
      currency = 'USD';
    }
  }

  // Convert to smallest unit (cents, paise, etc.)
  // JPY doesn't have subunits
  const amount_cents = currency === 'JPY' ? Math.round(amount) : Math.round(amount * 100);

  // ===== STEP 2: Extract Item Name =====
  // Priority: Extract product name, not random numbers
  // Handle: "Buy 2 Nike shoes for", "Buy $100 Nike shoes from", "Buy Nike shoes"
  let item_name = 'item';
  
  // Try pattern: "Buy [QTY] [ITEM] for/from/with/at" - MOST SPECIFIC
  let itemMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+\d+\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:for|from|with|at|on)/i);
  if (itemMatch) {
    item_name = itemMatch[1].trim();
  } else {
    // Try pattern: "Buy $X [ITEM] for/from/with/at"
    itemMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+\$[\d.]+\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:for|from|with|at)/i);
    if (itemMatch) {
      item_name = itemMatch[1].trim();
    } else {
      // Try pattern: "Buy [ITEM] for/from/with/at"
      itemMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+(?:a\s+|an\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:for|from|with|at)/i);
      if (itemMatch) {
        item_name = itemMatch[1].trim();
      } else {
        // Fallback: "Buy [ITEM]" (at end)
        itemMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+(?:a\s+|an\s+)?([a-z]+(?:\s+[a-z]+)?)\s*(?:\$|$)/i);
        if (itemMatch) {
          item_name = itemMatch[1].trim();
        }
      }
    }
  }

  // ===== STEP 3: Extract Quantity =====
  // Look for: "2 shoes", "5 items", "3 pairs"
  // Priority: Look for quantity BEFORE item name (e.g., "Buy 2 Nike shoes")
  let quantity = 1;
  const quantityMatch = prompt.match(/(?:buy|purchase|get|order|want)\s+(\d+)\s+/i);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]);
  }

  // ===== STEP 4: Extract Shipping Speed =====
  const expressMatch = /(express|overnight|fast|priority|rush|same.?day)/i;
  const shipping_speed = expressMatch.test(prompt) ? 'express' : 'standard';

  // ===== STEP 5: Extract Country =====
  let countryMatch = prompt.match(/(?:in|to|for|ship\s+to)\s+(?:the\s+)?([a-z]+)(?:\s+(?:with|for|and|to|in)|\s*$)?/i);
  if (!countryMatch) {
    countryMatch = prompt.match(/from\s+([a-z]+)(?:\s+|$)/i);
  }
  let country = 'US'; // default
  if (countryMatch) {
    const countryText = countryMatch[1].trim().toUpperCase();
    const countryMap: { [key: string]: string } = {
      US: 'US', USA: 'US', UNITED_STATES: 'US',
      UK: 'GB', UNITED_KINGDOM: 'GB', GB: 'GB', GREAT_BRITAIN: 'GB',
      CA: 'CA', CANADA: 'CA',
      FR: 'FR', FRANCE: 'FR',
      DE: 'DE', GERMANY: 'DE',
      AU: 'AU', AUSTRALIA: 'AU',
      JP: 'JP', JAPAN: 'JP',
    };
    country = countryMap[countryText] || countryMap[countryText.replace(/\s+/g, '_')] || 'US';
  }

  // ===== STEP 6: Extract Merchant =====
  let merchant: string | undefined = undefined;
  
  // Try patterns: "from Nike", "at Amazon", "on eBay"
  const merchantMatch = prompt.match(/(?:from|at|on)\s+([A-Z][a-z]+)(?:\s+|$|\s+with|\s+for|\s+in|\s+to)/i);
  if (merchantMatch) {
    merchant = merchantMatch[1].trim();
  }

  return {
    amount_cents,
    item_name,
    shipping_speed,
    country,
    quantity,
    currency,
    merchant,
  };
}
