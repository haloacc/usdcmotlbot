/**
 * Ported from legacy script.js
 */
export function parseNaturalLanguageToUCP(text: string) {
    const actionRegex = /(?:buy|get|purchase|order)\s+(?:a|an\s+)?/i;
    if (!actionRegex.test(text)) return null;

    let item = "Item";
    let amount = 100;
    let currency = "USD";

    // Extract amount and currency
    const usdMatch = text.match(/for\s+(?:\$|usd|dollars?|bucks?)\s*(\d+(?:\.\d+)?)|for\s+(\d+(?:\.\d+)?)\s*(?:\$|usd|dollars?|bucks?)/i);
    const inrMatch = text.match(/for\s+(?:₹|inr|rupees?)\s*(\d+(?:\.\d+)?)|for\s+(\d+(?:\.\d+)?)\s*(?:₹|inr|rupees?)/i);
    const eurMatch = text.match(/for\s+(?:€|eur|euros?)\s*(\d+(?:\.\d+)?)|for\s+(\d+(?:\.\d+)?)\s*(?:€|eur|euros?)/i);
    const gbpMatch = text.match(/for\s+(?:£|gbp|pounds?)\s*(\d+(?:\.\d+)?)|for\s+(\d+(?:\.\d+)?)\s*(?:£|gbp|pounds?)/i);
    const jpyMatch = text.match(/for\s+(?:¥|jpy|yen)\s*(\d+(?:\.\d+)?)|for\s+(\d+(?:\.\d+)?)\s*(?:¥|jpy|yen)/i);

    if (usdMatch) { amount = parseFloat(usdMatch[1] || usdMatch[2]); currency = 'USD'; }
    else if (inrMatch) { amount = parseFloat(inrMatch[1] || inrMatch[2]); currency = 'INR'; }
    else if (eurMatch) { amount = parseFloat(eurMatch[1] || eurMatch[2]); currency = 'EUR'; }
    else if (gbpMatch) { amount = parseFloat(gbpMatch[1] || gbpMatch[2]); currency = 'GBP'; }
    else if (jpyMatch) { amount = parseFloat(jpyMatch[1] || jpyMatch[2]); currency = 'JPY'; }

    // Extract shipping
    const hasExpress = /express|overnight|rush|fast/i.test(text);

    // Extract item
    const cleanText = text
        .replace(actionRegex, '')
        .replace(/for\s+[\d.]+\s*\w+/gi, '')
        .replace(/from\s+.+?(?:\s+|$)/gi, '')
        .replace(/with\s+express\s+shipping/gi, '')
        .trim();

    if (cleanText) item = cleanText;

    return {
        protocol: 'UCP',
        intent: {
            action: 'buy',
            params: {
                item: item,
                amount: amount,
                currency: currency,
                shipping_speed: hasExpress ? 'express' : 'standard'
            }
        }
    };
}
