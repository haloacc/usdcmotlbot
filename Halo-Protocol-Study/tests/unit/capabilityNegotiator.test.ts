/**
 * Unit tests for Capability Negotiation (Schema 2)
 */

import {
  negotiateCapabilities,
  getDefaultAgentCapabilities,
  generateSellerCapabilities,
} from '../../src/services/capabilityNegotiator';
import { AgentCapabilities, SellerCapabilities } from '../../src/types';

describe('Capability Negotiation', () => {
  describe('getDefaultAgentCapabilities', () => {
    it('should return default Halo agent capabilities', () => {
      const capabilities = getDefaultAgentCapabilities();
      
      expect(capabilities).toHaveProperty('interventions');
      expect(capabilities).toHaveProperty('features');
      expect(capabilities).toHaveProperty('payment_methods');
      expect(capabilities.payment_methods).toContain('card');
      expect(capabilities.interventions?.supported).toContain('3ds');
      expect(capabilities.features?.async_completion).toBe(true);
    });
  });

  describe('generateSellerCapabilities', () => {
    it('should generate basic seller capabilities', () => {
      const capabilities = generateSellerCapabilities();
      
      expect(capabilities).toHaveProperty('payment_methods');
      expect(capabilities).toHaveProperty('interventions');
      expect(capabilities).toHaveProperty('features');
      expect(capabilities.payment_methods.length).toBeGreaterThan(0);
    });

    it('should require auth for high-risk transactions', () => {
      const capabilities = generateSellerCapabilities({ highRisk: true });
      
      expect(capabilities.interventions?.required).toContain('3ds');
      expect(capabilities.interventions?.enforcement).toBe('always');
    });

    it('should support wallets when enabled', () => {
      const capabilities = generateSellerCapabilities({ supportsWallets: true });
      
      const paymentMethods = capabilities.payment_methods.map((pm) =>
        typeof pm === 'string' ? pm : pm.method
      );
      expect(paymentMethods).toContain('wallet.apple_pay');
    });

    it('should support BNPL when enabled', () => {
      const capabilities = generateSellerCapabilities({ supportsBNPL: true });
      
      const paymentMethods = capabilities.payment_methods.map((pm) =>
        typeof pm === 'string' ? pm : pm.method
      );
      expect(paymentMethods).toContain('bnpl.klarna');
    });
  });

  describe('negotiateCapabilities', () => {
    it('should succeed when capabilities are compatible', () => {
      const agentCapabilities = getDefaultAgentCapabilities();
      const sellerCapabilities = generateSellerCapabilities();
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(true);
      expect(result.status).toBe('ready_for_payment');
      expect(result.matched_payment_methods).toContain('card');
    });

    it('should fail when payment methods are incompatible', () => {
      const agentCapabilities: AgentCapabilities = {
        payment_methods: ['crypto.bitcoin'], // Agent only supports Bitcoin
      };
      const sellerCapabilities = generateSellerCapabilities(); // Seller only supports card
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(false);
      expect(result.status).toBe('not_ready_for_payment');
      expect(result.messages[0].code).toBe('payment_method_unsupported');
    });

    it('should fail when required interventions are not supported', () => {
      const agentCapabilities: AgentCapabilities = {
        payment_methods: ['card'],
        interventions: {
          supported: [], // Agent supports no interventions
        },
      };
      const sellerCapabilities = generateSellerCapabilities({ requiresAuth: true }); // Requires 3DS
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(false);
      expect(result.status).toBe('not_ready_for_payment');
      expect(result.messages[0].code).toBe('intervention_unsupported');
    });

    it('should set status to authentication_required when auth is always enforced', () => {
      const agentCapabilities = getDefaultAgentCapabilities();
      const sellerCapabilities = generateSellerCapabilities({ highRisk: true });
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(true);
      expect(result.status).toBe('authentication_required');
      expect(result.required_interventions).toContain('3ds');
      expect(result.messages.some(m => m.content.includes('authentication'))).toBe(true);
    });

    it('should include informational messages about features', () => {
      const agentCapabilities = getDefaultAgentCapabilities();
      const sellerCapabilities = generateSellerCapabilities();
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(true);
      expect(result.messages.some(m => m.type === 'info')).toBe(true);
    });

    it('should match supported payment methods', () => {
      const agentCapabilities: AgentCapabilities = {
        payment_methods: ['card', 'wallet.apple_pay'],
      };
      const sellerCapabilities = generateSellerCapabilities({ supportsWallets: true });
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(true);
      expect(result.matched_payment_methods).toContain('card');
      expect(result.matched_payment_methods).toContain('wallet.apple_pay');
    });

    it('should handle partial payment method overlap', () => {
      const agentCapabilities: AgentCapabilities = {
        payment_methods: ['card', 'crypto.bitcoin'], // Agent supports card + Bitcoin
      };
      const sellerCapabilities = generateSellerCapabilities(); // Seller only supports card
      
      const result = negotiateCapabilities(agentCapabilities, sellerCapabilities);
      
      expect(result.compatible).toBe(true); // Should succeed because card is matched
      expect(result.matched_payment_methods).toContain('card');
      expect(result.matched_payment_methods).not.toContain('crypto.bitcoin');
    });
  });
});
