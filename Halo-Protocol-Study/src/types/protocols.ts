/**
 * Complete Protocol Type Definitions
 * Covers ACP, UCP, and x402 - All features from official specs
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface Address {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string; // ISO-3166-1 alpha-2
  postal_code: string;
}

export interface Buyer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface Link {
  type: 'terms_of_use' | 'privacy_policy' | 'return_policy';
  url: string;
}

// ============================================================================
// ACP - AGENTIC COMMERCE PROTOCOL
// ============================================================================

// --- Items & Line Items ---
export interface ACPItem {
  id: string;
  quantity: number;
}

export interface ACPLineItem {
  id: string;
  item: ACPItem;
  name: string;
  description?: string;
  images?: string[];
  unit_amount: number; // cents
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  disclosures?: ACPDisclosure[];
  custom_attributes?: ACPCustomAttribute[];
  marketplace_seller_details?: { name: string };
}

export interface ACPDisclosure {
  type: 'disclaimer';
  content_type: 'plain' | 'markdown';
  content: string;
}

export interface ACPCustomAttribute {
  display_name: string;
  value: string;
}

// --- Totals ---
export interface ACPTotal {
  type: 'items_base_amount' | 'items_discount' | 'subtotal' | 'discount' | 'fulfillment' | 'tax' | 'fee' | 'total';
  display_text: string;
  amount: number;
  description?: string;
}

// --- Fulfillment ---
export interface ACPFulfillmentOptionShipping {
  type: 'shipping';
  id: string;
  title: string;
  subtitle?: string;
  carrier?: string;
  earliest_delivery_time?: string; // ISO datetime
  latest_delivery_time?: string;
  subtotal?: number;
  tax?: number;
  total: number;
}

export interface ACPFulfillmentOptionDigital {
  type: 'digital';
  id: string;
  title: string;
  subtitle?: string;
  subtotal?: number;
  tax?: number;
  total: number;
}

export type ACPFulfillmentOption = ACPFulfillmentOptionShipping | ACPFulfillmentOptionDigital;

export interface ACPSelectedFulfillmentOption {
  type: 'shipping' | 'digital';
  shipping?: { option_id: string; item_ids: string[] };
  digital?: { option_id: string; item_ids: string[] };
}

export interface ACPFulfillmentDetails {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: Address;
}

// --- Messages ---
export interface ACPMessageInfo {
  type: 'info';
  param?: string; // RFC 9535 JSONPath
  content_type: 'plain' | 'markdown';
  content: string;
}

export interface ACPMessageError {
  type: 'error';
  code: 'missing' | 'invalid' | 'out_of_stock' | 'payment_declined' | 'requires_sign_in' | 'requires_3ds';
  param?: string;
  content_type: 'plain' | 'markdown';
  content: string;
}

export type ACPMessage = ACPMessageInfo | ACPMessageError;

// --- Payment ---
export interface ACPPaymentProvider {
  provider: 'stripe';
  supported_payment_methods: Array<{ type: 'card' }>;
}

export interface ACPPaymentData {
  token: string;
  provider: 'stripe';
  billing_address?: Address;
}

// --- Affiliate Attribution ---
export interface ACPAffiliateAttribution {
  provider: string;
  token?: string;
  publisher_id?: string;
  campaign_id?: string;
  creative_id?: string;
  sub_id?: string;
  source?: {
    type: 'url' | 'platform' | 'unknown';
    url?: string;
  };
  issued_at?: string;
  expires_at?: string;
  metadata?: Record<string, string | number | boolean>;
  touchpoint?: 'first' | 'last';
}

// --- Order ---
export interface ACPOrder {
  id: string;
  checkout_session_id: string;
  permalink_url: string;
}

// --- Refund ---
export interface ACPRefund {
  type: 'store_credit' | 'original_payment';
  amount: number;
}

// --- Intent Trace (for cancellation) ---
export interface ACPIntentTrace {
  reason_code: 'price_sensitivity' | 'shipping_cost' | 'shipping_speed' | 'product_fit' | 
               'trust_security' | 'returns_policy' | 'payment_options' | 'comparison' | 
               'timing_deferred' | 'other';
  trace_summary?: string;
  metadata?: Record<string, string | number | boolean>;
}

// --- Session Status ---
export type ACPSessionStatus = 
  | 'not_ready_for_payment' 
  | 'ready_for_payment' 
  | 'authentication_required'
  | 'in_progress' 
  | 'completed' 
  | 'canceled';

// --- Checkout Session ---
export interface ACPCheckoutSession {
  id: string;
  status: ACPSessionStatus;
  currency: string;
  buyer?: Buyer;
  payment_provider?: ACPPaymentProvider;
  line_items: ACPLineItem[];
  fulfillment_details?: ACPFulfillmentDetails;
  fulfillment_options: ACPFulfillmentOption[];
  selected_fulfillment_options?: ACPSelectedFulfillmentOption[];
  totals: ACPTotal[];
  messages: ACPMessage[];
  links: Link[];
  order?: ACPOrder;
  expires_at?: string;
  // Halo extensions
  url?: string;
  halo_session_id?: string;
  halo_risk?: {
    score: number;
    decision: 'approve' | 'challenge' | 'block';
    factors: Record<string, boolean>;
  };
  seller_capabilities?: any;
}

// --- Requests ---
export interface ACPCheckoutCreateRequest {
  items: ACPItem[];
  buyer?: Buyer;
  fulfillment_details?: ACPFulfillmentDetails;
  affiliate_attribution?: ACPAffiliateAttribution;
}

export interface ACPCheckoutUpdateRequest {
  buyer?: Buyer;
  items?: ACPItem[];
  fulfillment_details?: ACPFulfillmentDetails;
  selected_fulfillment_options?: ACPSelectedFulfillmentOption[];
}

export interface ACPCheckoutCompleteRequest {
  buyer?: Buyer;
  payment_data: ACPPaymentData;
  affiliate_attribution?: ACPAffiliateAttribution;
}

export interface ACPCancelSessionRequest {
  intent_trace?: ACPIntentTrace;
}

// --- Delegate Payment ---
export interface ACPPaymentMethodCard {
  type: 'card';
  card_number_type: 'fpan' | 'network_token';
  number: string;
  exp_month: string;
  exp_year: string;
  name?: string;
  cvc?: string;
  cryptogram?: string;
  eci_value?: string;
  checks_performed?: Array<'avs' | 'cvv' | 'ani' | 'auth0'>;
  iin?: string;
  display_card_funding_type: 'credit' | 'debit' | 'prepaid';
  display_wallet_type?: string;
  display_brand?: string;
  display_last4?: string;
  metadata: Record<string, string>;
}

export interface ACPAllowance {
  reason: 'one_time';
  max_amount: number;
  currency: string;
  checkout_session_id: string;
  merchant_id: string;
  expires_at: string;
}

export interface ACPRiskSignal {
  type: 'card_testing';
  score: number;
  action: 'blocked' | 'manual_review' | 'authorized';
}

export interface ACPDelegatePaymentRequest {
  payment_method: ACPPaymentMethodCard;
  allowance: ACPAllowance;
  billing_address?: Address;
  risk_signals: ACPRiskSignal[];
  metadata: Record<string, string>;
}

export interface ACPDelegatePaymentResponse {
  id: string;
  created: string;
  metadata: Record<string, string>;
}

// --- Errors ---
export interface ACPError {
  type: 'invalid_request' | 'request_not_idempotent' | 'processing_error' | 'service_unavailable';
  code: string;
  message: string;
  param?: string;
}

// ============================================================================
// UCP - UNIVERSAL CHECKOUT PROTOCOL
// ============================================================================

export type UCPSessionStatus = 
  | 'incomplete' 
  | 'requires_escalation' 
  | 'ready_for_complete' 
  | 'complete_in_progress' 
  | 'completed' 
  | 'canceled';

export interface UCPLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url?: string;
}

export interface UCPTotal {
  type: 'subtotal' | 'shipping' | 'tax' | 'discount' | 'total';
  label: string;
  amount: number;
}

// Message types per official UCP spec
export interface UCPMessage {
  type: 'info' | 'error';
  code?: string; // Error code for error type
  content: string;
  param?: string; // JSONPath to affected field
}

export interface UCPCheckoutResponse {
  ucp: {
    schema: 'dev.ucp.shopping.checkout'; // Official schema name
    version: string; // e.g., '2026-01-11'
  };
  id: string;
  status: UCPSessionStatus;
  currency: string; // ISO 4217
  line_items: UCPLineItem[];
  buyer?: Buyer;
  totals: UCPTotal[];
  messages?: UCPMessage[];
  links: Link[];
  expires_at?: string; // RFC 3339, default 6 hours
  continue_url?: string; // Required when status is requires_escalation
  payment?: UCPPayment;
  order?: UCPOrderConfirmation; // Order confirmation (not full order)
}

// Order confirmation (returned in checkout response)
export interface UCPOrderConfirmation {
  id: string;
  permalink_url: string;
}

// Full Order structure per official UCP spec
export interface UCPOrder {
  ucp: {
    schema: 'dev.ucp.shopping.order';
    version: string;
  };
  id: string;
  checkout_id: string;
  permalink_url: string;
  line_items: UCPOrderLineItem[]; // Immutable - source of truth
  fulfillment: {
    expectations: UCPFulfillmentExpectation[];
    events: UCPFulfillmentEvent[]; // Append-only event log
  };
  adjustments?: UCPAdjustment[]; // Append-only event log
  totals: UCPTotal[];
}

// Item reference (product data)
export interface UCPItem {
  id: string;
  title: string;
  price: number; // Unit price in minor units
  image_url?: string;
}

// Order line item per official UCP spec
export interface UCPOrderLineItem {
  id: string;
  item: UCPItem; // Product data reference
  quantity: {
    total: number;     // Current total quantity ordered
    fulfilled: number; // Sum from fulfillment events
  };
  totals: UCPTotal[]; // Line item totals breakdown
  status: 'processing' | 'partial' | 'fulfilled'; // Derived from quantity
  parent_id?: string; // For nested structures
}

// Payment info per UCP spec
export interface UCPPayment {
  methods: string[]; // Supported payment methods
  required: boolean;
}

export interface UCPFulfillmentExpectation {
  id: string;
  type: 'shipping' | 'digital' | 'pickup';
  line_item_ids: string[];
  expected_date?: string;
  carrier?: string;
  tracking_number?: string;
}

// Extended fulfillment event types per official UCP spec
export type UCPFulfillmentEventType = 
  | 'processing'        // Preparing to ship
  | 'shipped'           // Handed to carrier
  | 'in_transit'        // In delivery network
  | 'delivered'         // Received by buyer
  | 'failed_attempt'    // Delivery attempt failed
  | 'canceled'          // Fulfillment canceled
  | 'undeliverable'     // Cannot be delivered
  | 'returned_to_sender'; // Returned to merchant

export interface UCPFulfillmentEvent {
  id: string;
  type: UCPFulfillmentEventType;
  occurred_at: string;
  line_items: Array<{
    id: string;
    quantity: number;
  }>;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  description?: string; // Human-readable status description
}

// Adjustment types per official UCP spec (open string, these are common values)
export type UCPAdjustmentType = 
  | 'refund'
  | 'return'
  | 'credit'
  | 'price_adjustment'
  | 'dispute'
  | 'cancellation'
  | string; // Open for merchant-specific types

export type UCPAdjustmentStatus = 'pending' | 'completed' | 'failed';

export interface UCPAdjustment {
  id: string;
  type: UCPAdjustmentType;
  occurred_at: string;
  status: UCPAdjustmentStatus;
  line_items?: Array<{
    id: string;
    quantity: number;
  }>;
  amount?: number; // In minor units (cents)
  description?: string; // Human-readable reason
}

// ============================================================================
// X402 - HTTP 402 PAYMENT REQUIRED
// ============================================================================

export interface X402PaymentRequirement {
  scheme: string;
  network: string; // CAIP-2 format (e.g., 'eip155:84532')
  asset: string; // Token contract address
  amount: string; // Atomic units
  payTo: string; // Wallet address
  maxTimeoutSeconds: number;
  extra: {
    name?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface X402Resource {
  url: string;
  description: string;
  mimeType: string;
}

export interface X402PaymentRequired {
  x402Version: 2;
  error?: string;
  resource: X402Resource;
  accepts: X402PaymentRequirement[];
  extensions?: {
    halo_risk?: {
      score: number;
      decision: 'approve' | 'challenge' | 'block';
    };
    requires_confirmation?: boolean;
    confirmation_type?: 'wallet_signature' | 'multi_sig';
    message?: string;
    [key: string]: any;
  };
}

// EVM Exact Scheme Authorization per official x402 spec
export interface X402EVMAuthorization {
  from: string;      // Payer wallet address
  to: string;        // Recipient wallet address
  value: string;     // Amount in atomic units
  validAfter: string;  // Unix timestamp
  validBefore: string; // Unix timestamp
  nonce: string;     // Unique nonce (hex)
}

export interface X402PaymentPayload {
  x402Version: 2;
  resource?: X402Resource;
  accepted: X402PaymentRequirement;
  payload: {
    signature: string;  // EIP-712 signature
    authorization: X402EVMAuthorization;
  };
  extensions?: Record<string, any>;
}

// SettlementResponse per official x402 spec
export interface X402SettlementResponse {
  success: boolean;
  transaction: string;  // Blockchain tx hash (empty if failed)
  network: string;      // CAIP-2 network identifier
  payer?: string;       // Payer wallet address
  errorReason?: string; // Error reason if failed
  extensions?: Record<string, any>;
}

// VerifyResponse per official x402 spec
export interface X402VerifyResponse {
  isValid: boolean;
  invalidReason?: string; // Reason for invalidity
  payer?: string;         // Payer wallet address
}

// Legacy response format (for backwards compatibility)
export interface X402PaymentResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: string;
    message?: string;
    blockNumber?: number;
    confirmations?: number;
  };
  error?: string;
}

// ============================================================================
// HALO ORCHESTRATION TYPES
// ============================================================================

export interface HaloSession {
  id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  status: 'active' | 'completed' | 'canceled' | 'expired';
  
  // Protocol info
  agent_protocol: string;
  merchant_protocol: string;
  
  // Checkout data
  checkout: {
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    currency: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  
  // Buyer info
  buyer?: Buyer;
  shipping_address?: Address;
  billing_address?: Address;
  
  // Fulfillment
  fulfillment?: {
    type: 'shipping' | 'digital';
    option_id: string;
    carrier?: string;
    estimated_delivery?: string;
  };
  
  // Risk evaluation
  risk: {
    score: number;
    decision: 'approve' | 'challenge' | 'block';
    factors: Record<string, boolean>;
    verified?: boolean;
    verification_method?: string;
  };
  
  // Payment
  payment?: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    method: string;
    transaction_id?: string;
    amount: number;
    currency: string;
    card_last4?: string;
    card_brand?: string;
  };
  
  // Order (after completion)
  order?: {
    id: string;
    permalink_url: string;
    fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered';
    tracking?: {
      carrier: string;
      number: string;
      url: string;
    };
  };
  
  // Metadata
  metadata: Record<string, any>;
}

export interface HaloSessionStore {
  sessions: Map<string, HaloSession>;
  get(id: string): HaloSession | undefined;
  create(data: Partial<HaloSession>): HaloSession;
  update(id: string, data: Partial<HaloSession>): HaloSession | undefined;
  delete(id: string): boolean;
  cleanup(): void; // Remove expired sessions
}
