/**
 * Protocol Adapter Interface
 * 
 * All protocols (ACP, UCP, x402) must implement this interface.
 * This allows Halo to be a universal orchestrator that can translate
 * between any combination of agent and merchant protocols.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface IProtocolAdapter {
  // Metadata
  readonly protocolName: string;
  readonly version: string;
  readonly description?: string;

  // Request parsing (from agent or merchant → canonical)
  validateRequest(raw: any): ValidationResult;
  parseRequest(raw: any): any; // Returns protocol-specific canonical format

  // Response building (canonical → agent or merchant response)
  validateResponse(canonical: any): ValidationResult;
  buildResponse(canonical: any, metadata?: any): any;

  // Optional: Capability negotiation support
  supportsCapabilityNegotiation?(): boolean;
  
  // Optional: Protocol detection helper
  canHandle?(raw: any): boolean;
}

/**
 * Protocol Metadata
 * Used by the router to understand protocol capabilities
 */
export interface ProtocolMetadata {
  name: string;
  version: string;
  features: {
    capabilityNegotiation: boolean;
    delegatePayment: boolean;
    asyncPayment: boolean;
    webhooks: boolean;
  };
  paymentMethods: string[];
  interventions: string[];
}
