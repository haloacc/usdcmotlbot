export interface PaymentMethod {
  id: string;
  user_id: string;
  
  // Card details (tokenized - never store raw)
  stripe_payment_method_id: string;
  card_brand: string; // visa, mastercard, amex, etc.
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  card_holder_name: string;
  
  // Verification
  verified: boolean;
  verification_otp?: string;
  verification_otp_expires?: Date;
  
  // Billing address
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  
  // Metadata
  is_default: boolean;
  created_at: Date;
  last_used?: Date;
  status: 'active' | 'expired' | 'removed';
}

export interface AddPaymentMethodRequest {
  user_id: string;
  stripe_payment_method_id?: string; // Tokenized payment method from Stripe.js
  card_number?: string; // Legacy: Will be tokenized immediately
  card_holder_name: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_cvv?: string;
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface VerifyPaymentMethodRequest {
  payment_method_id: string;
  otp: string;
}
