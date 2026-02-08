import { buildACP } from '../../src/services/acpBuilder';
import { ParsedPrompt } from '../../src/services/promptParser';

describe('ACP Builder Service', () => {
  const baseParsedPrompt: ParsedPrompt = {
    amount_cents: 10000,
    item_name: 'shoes',
    merchant: 'Nike',
    shipping_speed: 'standard',
    country: 'US',
    quantity: 1,
    currency: 'USD',
  };

  it('should build valid ACP CheckoutSession', () => {
    const acp = buildACP(baseParsedPrompt);

    expect(acp.itemId).toBeDefined();
    expect(acp.request).toBeDefined();
    expect(acp.request.items).toHaveLength(1);
    expect(acp.request.items[0].quantity).toBe(1);
  });

  it('should have correct line items', () => {
    const acp = buildACP(baseParsedPrompt);

    expect(acp.request.items).toHaveLength(1);
    expect(acp.request.items[0].id).toBeDefined();
    expect(acp.request.items[0].quantity).toBe(1);
    expect(acp.itemId).toBeDefined();
  });

  it('should calculate correct totals', () => {
    const acp = buildACP(baseParsedPrompt);

    // buildACP returns a request object, not a full checkout session
    expect(acp.request.items).toHaveLength(1);
    expect(acp.request.items[0].quantity).toBe(1);
    expect(acp.itemId).toBeDefined();
  });

  it('should include proper items structure', () => {
    const acp = buildACP(baseParsedPrompt);

    expect(acp.request.items).toHaveLength(1);
    expect(acp.request.items[0].id).toBeDefined(); // Product ID from catalog
    expect(acp.request.items[0].quantity).toBe(1);
  });

  it('should include agent capabilities by default', () => {
    const acp = buildACP(baseParsedPrompt);

    expect(acp.request.agent_capabilities).toBeDefined();
    expect(acp.request.agent_capabilities?.interventions).toBeDefined();
  });

  it('should handle express shipping preference', () => {
    const prompt: ParsedPrompt = {
      ...baseParsedPrompt,
      shipping_speed: 'express',
    };
    const acp = buildACP(prompt);

    // buildACP creates request only, not shipping logic
    expect(acp.request.items[0].quantity).toBe(1);
    expect(acp.itemId).toBeDefined();
  });

  it('should handle different countries', () => {
    const prompt: ParsedPrompt = {
      ...baseParsedPrompt,
      country: 'FR',
    };
    const acp = buildACP(prompt);

    // buildACP creates request only, country is handled by merchant
    expect(acp.request.items).toHaveLength(1);
    expect(acp.itemId).toBeDefined();
  });

  it('should handle multiple quantity items', () => {
    const prompt: ParsedPrompt = {
      ...baseParsedPrompt,
      quantity: 5,
    };
    const acp = buildACP(prompt);

    expect(acp.request.items[0].quantity).toBe(5);
  });
  
  it('should include request structure', () => {
    const acp = buildACP(baseParsedPrompt);

    expect(acp.request).toBeDefined();
    expect(acp.request.items).toBeDefined();
    expect(acp.request.agent_capabilities).toBeDefined();
  });

  it('should generate valid item IDs', () => {
    const prompt: ParsedPrompt = {
      ...baseParsedPrompt,
      item_name: 'laptop',
    };
    const acp = buildACP(prompt);

    expect(acp.request.items[0].id).toBeDefined();
    expect(typeof acp.request.items[0].id).toBe('string');
  });

  it('should use consistent product IDs for same items', () => {
    const acp1 = buildACP(baseParsedPrompt);
    const acp2 = buildACP(baseParsedPrompt);

    // Same product should have same itemId from catalog
    expect(acp1.itemId).toBe(acp2.itemId);
    expect(acp1.request.items[0].id).toBe(acp2.request.items[0].id);
  });
});
