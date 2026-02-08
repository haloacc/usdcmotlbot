export interface User {
  id: string;
  email: string;
  mobile?: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  
  // Verification
  email_verified: boolean;
  mobile_verified: boolean;
  email_verification_token?: string;
  mobile_otp?: string;
  mobile_otp_expires?: Date;
  
  // Passkey/Biometric
  passkey_credential_id?: string;
  passkey_public_key?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  
  // Account status
  status: 'active' | 'suspended' | 'pending_verification';
  
  // Stripe
  stripe_customer_id?: string; // Stripe Customer ID for payment methods
}

export interface UserSession {
  session_id: string;
  user_id: string;
  token: string;
  created_at: Date;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface CreateUserRequest {
  email: string;
  mobile?: string;
  password: string;
  first_name?: string;
  last_name?: string;
  mobile_verified?: boolean; // Set true if OTP verified before signup
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOTPRequest {
  user_id: string;
  otp: string;
  type: 'email' | 'mobile';
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  new_password: string;
}
