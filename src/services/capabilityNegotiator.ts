/**
 * Capability Negotiation Service
 * Implements ACP Schema 2: Capability Negotiation
 * 
 * Handles:
 * 1. Agent capability declaration
 * 2. Seller capability advertisement
 * 3. Capability compatibility checking
 * 4. Early incompatibility detection
 */

import {
  AgentCapabilities,
  SellerCapabilities,
  PaymentMethodDetails
} from '../types';

export interface CapabilityMatchResult {
  compatible: boolean;
  status: 'ready_for_payment' | 'not_ready_for_payment' | 'authentication_required';
  messages: Array<{
    type: 'error' | 'warning' | 'info';
    code?: string;
    content_type: 'plain';
    content: string;
  }>;
  matched_payment_methods: string[];
  required_interventions: string[];
  supported_interventions: string[];
}

/**
 * Get default agent capabilities for Halo
 */
export function getDefaultAgentCapabilities(): AgentCapabilities {
  return {
    interventions: {
      supported: [
        '3ds',
        '3ds2',
        '3ds_redirect',
        '3ds_challenge',
        'address_verification'
      ],
      max_redirects: 1,
      redirect_context: 'in_app',
      max_interaction_depth: 2,
      display_context: 'webview'
    },
    features: {
      async_completion: true,
      session_persistence: true
    },
    payment_methods: ['card']
  };
}

/**
 * Check if agent can handle required seller interventions
 */
function checkInterventionCompatibility(
  agentCapabilities: AgentCapabilities,
  sellerCapabilities: SellerCapabilities
): { compatible: boolean; missing: string[] } {
  const agentInterventions = agentCapabilities.interventions?.supported || [];
  const requiredInterventions = sellerCapabilities.interventions?.required || [];
  
  const missing = requiredInterventions.filter(
    (intervention) => !agentInterventions.includes(intervention as any)
  );
  
  return {
    compatible: missing.length === 0,
    missing
  };
}

/**
 * Check if agent and seller have compatible payment methods
 */
function checkPaymentMethodCompatibility(
  agentCapabilities: AgentCapabilities,
  sellerCapabilities: SellerCapabilities
): { compatible: boolean; matched: string[]; missing: string[] } {
  const agentMethods = agentCapabilities.payment_methods || ['card'];
  const sellerMethods = sellerCapabilities.payment_methods.map((pm) => {
    if (typeof pm === 'string') {
      return pm;
    }
    return (pm as PaymentMethodDetails).method;
  });
  
  const matched = agentMethods.filter((method) => sellerMethods.includes(method));
  const missing = agentMethods.filter((method) => !sellerMethods.includes(method));
  
  return {
    compatible: matched.length > 0,
    matched,
    missing
  };
}

/**
 * Negotiate capabilities between agent and seller
 */
export function negotiateCapabilities(
  agentCapabilities: AgentCapabilities,
  sellerCapabilities: SellerCapabilities
): CapabilityMatchResult {
  const messages: CapabilityMatchResult['messages'] = [];
  
  // Check payment method compatibility
  const paymentMethodCheck = checkPaymentMethodCompatibility(
    agentCapabilities,
    sellerCapabilities
  );
  
  if (!paymentMethodCheck.compatible) {
    messages.push({
      type: 'error',
      code: 'payment_method_unsupported',
      content_type: 'plain',
      content: `Agent payment methods [${agentCapabilities.payment_methods?.join(', ')}] are not supported by seller. Seller accepts: ${sellerCapabilities.payment_methods.map(pm => typeof pm === 'string' ? pm : pm.method).join(', ')}.`
    });
    
    return {
      compatible: false,
      status: 'not_ready_for_payment',
      messages,
      matched_payment_methods: [],
      required_interventions: sellerCapabilities.interventions?.required || [],
      supported_interventions: agentCapabilities.interventions?.supported || []
    };
  }
  
  // Check intervention compatibility
  const interventionCheck = checkInterventionCompatibility(
    agentCapabilities,
    sellerCapabilities
  );
  
  if (!interventionCheck.compatible) {
    messages.push({
      type: 'error',
      code: 'intervention_unsupported',
      content_type: 'plain',
      content: `Seller requires interventions [${interventionCheck.missing.join(', ')}] that agent cannot handle.`
    });
    
    return {
      compatible: false,
      status: 'not_ready_for_payment',
      messages,
      matched_payment_methods: paymentMethodCheck.matched,
      required_interventions: sellerCapabilities.interventions?.required || [],
      supported_interventions: agentCapabilities.interventions?.supported || []
    };
  }
  
  // Check if authentication is required
  const requiredInterventions = sellerCapabilities.interventions?.required || [];
  const enforcement = sellerCapabilities.interventions?.enforcement || 'conditional';
  
  let status: CapabilityMatchResult['status'] = 'ready_for_payment';
  
  if (requiredInterventions.length > 0 && enforcement === 'always') {
    status = 'authentication_required';
    messages.push({
      type: 'info',
      content_type: 'plain',
      content: `This purchase will require ${requiredInterventions.join(', ')} authentication at checkout.`
    });
  }
  
  // Add informational messages about capabilities
  if (sellerCapabilities.features?.network_tokenization) {
    messages.push({
      type: 'info',
      content_type: 'plain',
      content: 'Network tokenization is supported for enhanced security.'
    });
  }
  
  if (sellerCapabilities.features?.saved_payment_methods) {
    messages.push({
      type: 'info',
      content_type: 'plain',
      content: 'You can save your payment method for future purchases.'
    });
  }
  
  return {
    compatible: true,
    status,
    messages,
    matched_payment_methods: paymentMethodCheck.matched,
    required_interventions: requiredInterventions,
    supported_interventions: agentCapabilities.interventions?.supported || []
  };
}

/**
 * Generate seller capabilities based on merchant configuration
 * This simulates what a real merchant would return
 */
export function generateSellerCapabilities(options?: {
  requiresAuth?: boolean;
  supportsWallets?: boolean;
  supportsBNPL?: boolean;
  highRisk?: boolean;
}): SellerCapabilities {
  const {
    requiresAuth = false,
    supportsWallets = false,
    supportsBNPL = false,
    highRisk = false
  } = options || {};
  
  const paymentMethods: Array<string | PaymentMethodDetails> = [
    {
      method: 'card',
      brands: ['visa', 'mastercard', 'amex', 'discover'],
      funding_types: ['credit', 'debit']
    }
  ];
  
  if (supportsWallets) {
    paymentMethods.push('wallet.apple_pay', 'wallet.google_pay');
  }
  
  if (supportsBNPL) {
    paymentMethods.push('bnpl.klarna', 'bnpl.affirm');
  }
  
  const interventions: SellerCapabilities['interventions'] = {
    required: requiresAuth || highRisk ? ['3ds'] : [],
    supported: [
      '3ds',
      '3ds2',
      '3ds_redirect',
      '3ds_challenge',
      '3ds_frictionless',
      'biometric',
      'address_verification'
    ],
    enforcement: highRisk ? 'always' : 'conditional'
  };
  
  const features: SellerCapabilities['features'] = {
    network_tokenization: true,
    saved_payment_methods: true,
    partial_auth: false,
    async_completion: true
  };
  
  return {
    payment_methods: paymentMethods,
    interventions,
    features
  };
}
