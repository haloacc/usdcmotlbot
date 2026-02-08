// Real ACP Checkout Protocol Types

// ============================================================
// SCHEMA 2: CAPABILITY NEGOTIATION
// ============================================================

export interface AgentInterventionCapabilities {
  supported: Array<
    | '3ds'
    | '3ds2'
    | '3ds_redirect'
    | '3ds_challenge'
    | '3ds_frictionless'
    | 'biometric'
    | '3ri'
    | 'otp'
    | 'email_verification'
    | 'sms_verification'
    | 'address_verification'
    | 'payment_method_update'
  >;
  max_redirects?: number; // default: 0
  redirect_context?: 'in_app' | 'external_browser' | 'none';
  max_interaction_depth?: number; // default: 1
  display_context?: 'native' | 'webview' | 'modal' | 'redirect';
}

export interface AgentFeatureCapabilities {
  async_completion?: boolean; // default: false
  session_persistence?: boolean; // default: false
  multi_session?: boolean; // default: false
}

export interface AgentCapabilities {
  interventions?: AgentInterventionCapabilities;
  features?: AgentFeatureCapabilities;
  payment_methods?: string[]; // e.g., ["card"]
}

export interface PaymentMethodDetails {
  method: string; // e.g., "card"
  brands?: string[]; // e.g., ["visa", "mastercard"]
  funding_types?: string[]; // e.g., ["credit", "debit"]
}

export interface SellerInterventionCapabilities {
  required?: string[]; // e.g., ["3ds"]
  supported: Array<
    | '3ds'
    | '3ds2'
    | '3ds_redirect'
    | '3ds_challenge'
    | '3ds_frictionless'
    | 'biometric'
    | 'otp'
    | 'email_verification'
    | 'sms_verification'
    | 'address_verification'
  >;
  enforcement?: 'always' | 'conditional' | 'optional'; // default: conditional
}

export interface SellerFeatureCapabilities {
  partial_auth?: boolean; // default: false
  saved_payment_methods?: boolean; // default: false
  network_tokenization?: boolean; // default: false
  async_completion?: boolean; // default: false
}

export interface SellerCapabilities {
  payment_methods: Array<string | PaymentMethodDetails>; // ["card", "bnpl.klarna", etc.]
  interventions?: SellerInterventionCapabilities;
  features?: SellerFeatureCapabilities;
}

// ACP CREATE REQUEST (minimal format sent to merchant) - NOW WITH CAPABILITY NEGOTIATION
export interface ACPCreateRequest {
  items: Item[];
  agent_capabilities?: AgentCapabilities;
}

export interface Address {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface Item {
  id: string;
  quantity: number;
}

export interface LineItem {
  id: string;
  item: Item;
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  name?: string;
  description?: string;
  images?: string[];
  unit_amount?: number;
  custom_attributes?: { display_name: string; value: string }[];
  disclosures?: { type: string; content_type: string; content: string }[];
}

export interface Total {
  type: 'items_base_amount' | 'items_discount' | 'subtotal' | 'discount' | 'fulfillment' | 'tax' | 'fee' | 'total';
  display_text: string;
  amount: number;
  description?: string;
}

export interface PaymentMethod {
  type: 'card';
  supported_card_networks?: ('amex' | 'discover' | 'mastercard' | 'visa')[];
}

export interface PaymentProvider {
  provider: 'stripe';
  supported_payment_methods: PaymentMethod[];
}

export interface FulfillmentOptionShipping {
  type: 'shipping';
  id: string;
  title: string;
  subtitle?: string;
  carrier?: string;
  earliest_delivery_time?: string;
  latest_delivery_time?: string;
  subtotal?: number;
  tax?: number;
  total: number;
}

export interface FulfillmentOptionDigital {
  type: 'digital';
  id: string;
  title: string;
  subtitle?: string;
  subtotal?: number;
  tax?: number;
  total: number;
}

export type FulfillmentOption = FulfillmentOptionShipping | FulfillmentOptionDigital;

export interface SelectedShippingFulfillmentOption {
  option_id: string;
  item_ids: string[];
}

export interface SelectedDigitalFulfillmentOption {
  option_id: string;
  item_ids: string[];
}

export interface SelectedFulfillmentOption {
  type: 'shipping' | 'digital';
  shipping?: SelectedShippingFulfillmentOption;
  digital?: SelectedDigitalFulfillmentOption;
}

export interface FulfillmentDetails {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: Address;
}

export interface ACPCheckoutSession {
  id: string;
  status: 'not_ready_for_payment' | 'authentication_required' | 'ready_for_payment' | 'completed' | 'canceled' | 'in_progress';
  currency: string;
  payment_provider: PaymentProvider;
  seller_capabilities?: SellerCapabilities; // Schema 2: Capability Negotiation
  line_items: LineItem[];
  totals: Total[];
  fulfillment_options: FulfillmentOption[];
  fulfillment_details?: FulfillmentDetails;
  selected_fulfillment_options?: SelectedFulfillmentOption[];
  messages?: Array<{ type: string; code?: string; content_type: string; content: string }>; // For capability errors
  [key: string]: any; // Allow additional fields
}

export interface ACPPayload {
  protocol: string;
  payload: ACPCheckoutSession;
}

export interface NormalizedPayload {
  halo_normalized: {
    total_cents: number;
    currency: string;
    country: string;
    provider: string;
    shipping_speed: string;
  };
}

export interface Decision {
  risk_score: number;
  decision: 'approve' | 'challenge' | 'block';
  normalized_payload: NormalizedPayload;
}

// ========== DELEGATE PAYMENT TYPES (Schema 3) ==========

export interface CardPaymentMethod {
  type: 'card';
  card_number_type?: 'fpan' | 'dpan';
  virtual?: boolean;
  number: string;
  exp_month: string;
  exp_year: string;
  name: string;
  cvc: string;
  checks_performed?: ('avs' | 'cvv')[];
  iin?: string;
  display_card_funding_type?: 'credit' | 'debit' | 'prepaid';
  display_wallet_type?: 'apple_pay' | 'google_pay';
  display_brand?: 'visa' | 'mastercard' | 'amex' | 'discover';
  display_last4?: string;
  metadata?: Record<string, any>;
}

export interface PaymentAllowance {
  reason: 'one_time' | 'subscription' | 'recurring';
  max_amount: number;
  currency: string;
  checkout_session_id: string;
  merchant_id: string;
  expires_at: string;
}

export interface RiskSignal {
  type: 'card_testing' | 'high_velocity' | 'suspicious_location' | 'new_account' | 'high_amount';
  score: number; // 0-100
  action: 'allow' | 'manual_review' | 'challenge' | 'block';
  metadata?: Record<string, any>;
}

export interface BillingAddress {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface DelegatePaymentRequest {
  payment_method: CardPaymentMethod;
  allowance: PaymentAllowance;
  billing_address: BillingAddress;
  risk_signals: RiskSignal[];
  metadata?: Record<string, any>;
}

export interface DelegatePaymentSuccessResponse {
  id: string; // vt_01J8Z3WXYZ9ABC
  created: string; // ISO 8601 timestamp
  metadata: {
    source: string;
    merchant_id: string;
    idempotency_key: string;
    tx_hash?: string;
    blockchain?: string;
    settlement?: string;
    cctp_bridged?: string;
  };
}

export interface DelegatePaymentErrorResponse {
  type: 'invalid_request' | 'rate_limit_exceeded' | 'payment_failed';
  code: 'invalid_card' | 'idempotency_conflict' | 'too_many_requests' | 'insufficient_funds' | 'card_declined';
  message: string;
  param?: string;
}