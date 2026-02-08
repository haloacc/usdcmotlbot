import { PaymentMethod, AddPaymentMethodRequest, VerifyPaymentMethodRequest } from '../models/paymentMethod';
import { userService } from './userService';
import { smsService } from './smsService';
import { emailService } from './emailService';
import Stripe from 'stripe';
import crypto from 'crypto';

// In-memory store (replace with database in production)
export const paymentMethods = new Map<string, PaymentMethod>();
export const userPaymentMethods = new Map<string, string[]>(); // user_id -> payment_method_ids[]

class PaymentMethodService {
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2020-08-27',
    });
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Add payment method
  async addPaymentMethod(req: AddPaymentMethodRequest): Promise<PaymentMethod> {
    // Verify user exists
    const user = await userService.getUserById(req.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    try {
      // Step 1: Get or create Stripe Customer for this user
      let stripeCustomerId = user.stripe_customer_id;

      if (!stripeCustomerId) {
        // Create new Stripe Customer
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: {
            halo_user_id: user.id,
          },
        });
        stripeCustomerId = customer.id;
        user.stripe_customer_id = stripeCustomerId;
        console.log(`[PaymentMethodService] Created Stripe Customer: ${stripeCustomerId}`);
      }

      // Map test card numbers to Stripe test tokens
      const testCardTokens: { [key: string]: string } = {
        '4242424242424242': 'tok_visa',           // Visa - success
        '4000056655665556': 'tok_visa_debit',     // Visa (debit)
        '5555555555554444': 'tok_mastercard',     // Mastercard
        '2223003122003222': 'tok_mastercard',     // Mastercard (2-series)
        '5200828282828210': 'tok_mastercard_debit', // Mastercard (debit)
        '378282246310005': 'tok_amex',            // Amex
        '6011111111111117': 'tok_discover',       // Discover
        '3056930009020004': 'tok_diners',         // Diners
        '30569309025904': 'tok_diners',           // Diners (14 digit)
        '6200000000000005': 'tok_unionpay',       // UnionPay
      };

      const isTestCard = req.card_number && req.card_number.startsWith('42');
      const stripeToken = req.card_number ? testCardTokens[req.card_number] : null;

      let stripePaymentMethod: any;
      let cardBrand = 'unknown';
      let cardLast4 = '0000';

      if (req.stripe_payment_method_id) {
        // Retrieve the already-created payment method
        stripePaymentMethod = await this.stripe.paymentMethods.retrieve(req.stripe_payment_method_id);
        cardBrand = stripePaymentMethod.card?.brand || 'unknown';
        cardLast4 = stripePaymentMethod.card?.last4 || '0000';

        // Attach to customer if not already attached
        if (!stripePaymentMethod.customer) {
          await this.stripe.paymentMethods.attach(stripePaymentMethod.id, {
            customer: stripeCustomerId,
          });
          console.log(`[PaymentMethodService] Attached PaymentMethod ${stripePaymentMethod.id} to Customer ${stripeCustomerId}`);
        }
      } else if (req.card_number) {
        if (!stripeToken) {
          throw new Error(`Test card ${req.card_number} not supported. Use 4242424242424242 for testing.`);
        }

        // Create Stripe PaymentMethod from test token
        stripePaymentMethod = await this.stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: stripeToken,
          },
          billing_details: {
            name: req.card_holder_name,
            address: req.billing_address ? {
              line1: req.billing_address.line1,
              line2: req.billing_address.line2,
              city: req.billing_address.city,
              state: req.billing_address.state,
              postal_code: req.billing_address.postal_code,
              country: req.billing_address.country,
            } : undefined,
          },
        });

        // Attach to customer
        await this.stripe.paymentMethods.attach(stripePaymentMethod.id, {
          customer: stripeCustomerId,
        });
        console.log(`[PaymentMethodService] Created and attached PaymentMethod ${stripePaymentMethod.id} to Customer ${stripeCustomerId}`);

        cardBrand = stripePaymentMethod.card?.brand || 'unknown';
        cardLast4 = stripePaymentMethod.card?.last4 || '0000';
      } else {
        throw new Error('Either stripe_payment_method_id or card details must be provided');
      }

      // Generate OTP for verification (skip for test cards)
      const otp = isTestCard ? undefined : this.generateOTP();
      const otpExpires = isTestCard ? undefined : new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Create payment method record
      const paymentMethodId = `pm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const paymentMethod: PaymentMethod = {
        id: paymentMethodId,
        user_id: req.user_id,
        stripe_payment_method_id: stripePaymentMethod.id,
        card_brand: cardBrand,
        card_last4: cardLast4,
        card_exp_month: req.card_exp_month || 12,
        card_exp_year: req.card_exp_year || 2028,
        card_holder_name: req.card_holder_name,
        verified: isTestCard ? true : false,
        verification_otp: otp,
        verification_otp_expires: otpExpires,
        billing_address: req.billing_address,
        is_default: false,
        created_at: new Date(),
        status: 'active',
      };

      // Check if this is the first payment method for the user
      const userPMs = userPaymentMethods.get(req.user_id) || [];
      if (userPMs.length === 0) {
        paymentMethod.is_default = true;
      }

      // Store payment method
      paymentMethods.set(paymentMethodId, paymentMethod);
      userPMs.push(paymentMethodId);
      userPaymentMethods.set(req.user_id, userPMs);

      // Send OTP to user's mobile or email
      if (otp) {
        try {
          if (user.mobile && user.mobile_verified) {
            await smsService.sendOTP(user.mobile, otp);
            console.log(`[PaymentMethodService] OTP sent to mobile ${user.mobile}: ${otp}`);
          } else {
            await emailService.sendVerificationEmail(user.email, otp);
            console.log(`[PaymentMethodService] OTP sent to email ${user.email}: ${otp}`);
          }
        } catch (notifyError) {
          console.error('[PaymentMethodService] Failed to send OTP:', notifyError);
          // Don't fail the whole operation if notification fails
        }
      }

      return this.sanitizePaymentMethod(paymentMethod);
    } catch (error: any) {
      console.error('[PaymentMethodService] Stripe error:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  // Verify payment method with OTP
  async verifyPaymentMethod(req: VerifyPaymentMethodRequest): Promise<PaymentMethod> {
    const paymentMethod = paymentMethods.get(req.payment_method_id);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    if (!paymentMethod.verification_otp || !paymentMethod.verification_otp_expires) {
      throw new Error('No OTP pending');
    }

    if (paymentMethod.verification_otp_expires < new Date()) {
      throw new Error('OTP expired');
    }

    if (paymentMethod.verification_otp !== req.otp) {
      throw new Error('Invalid OTP');
    }

    // Mark as verified
    paymentMethod.verified = true;
    paymentMethod.verification_otp = undefined;
    paymentMethod.verification_otp_expires = undefined;

    paymentMethods.set(req.payment_method_id, paymentMethod);

    return this.sanitizePaymentMethod(paymentMethod);
  }

  // Resend OTP for payment method
  async resendPaymentMethodOTP(paymentMethodId: string): Promise<void> {
    const paymentMethod = paymentMethods.get(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const user = await userService.getUserById(paymentMethod.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const otp = this.generateOTP();
    paymentMethod.verification_otp = otp;
    paymentMethod.verification_otp_expires = new Date(Date.now() + 10 * 60 * 1000);

    paymentMethods.set(paymentMethodId, paymentMethod);

    // Send OTP
    try {
      if (user.mobile && user.mobile_verified) {
        await smsService.sendOTP(user.mobile, otp);
        console.log(`[PaymentMethodService] OTP resent to mobile ${user.mobile}: ${otp}`);
      } else {
        await emailService.sendVerificationEmail(user.email, otp);
        console.log(`[PaymentMethodService] OTP resent to email ${user.email}: ${otp}`);
      }
    } catch (notifyError) {
      console.error('[PaymentMethodService] Failed to resend OTP:', notifyError);
      // Don't fail the operation if notification fails
    }
  }

  // Get payment methods for user
  async getPaymentMethodsForUser(userId: string): Promise<PaymentMethod[]> {
    const pmIds = userPaymentMethods.get(userId) || [];
    const pms = pmIds
      .map(id => paymentMethods.get(id))
      .filter((pm): pm is PaymentMethod => pm !== undefined && pm.status === 'active')
      .map(pm => this.sanitizePaymentMethod(pm));

    return pms;
  }

  // Get payment method by ID
  async getPaymentMethodById(paymentMethodId: string, userId: string): Promise<PaymentMethod | null> {
    const pm = paymentMethods.get(paymentMethodId);
    if (!pm || pm.user_id !== userId) {
      return null;
    }

    return this.sanitizePaymentMethod(pm);
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<PaymentMethod> {
    const pm = paymentMethods.get(paymentMethodId);
    if (!pm || pm.user_id !== userId) {
      throw new Error('Payment method not found');
    }

    // Unset other default payment methods
    const userPMs = userPaymentMethods.get(userId) || [];
    userPMs.forEach(id => {
      const existingPM = paymentMethods.get(id);
      if (existingPM && existingPM.id !== paymentMethodId) {
        existingPM.is_default = false;
        paymentMethods.set(id, existingPM);
      }
    });

    // Set this as default
    pm.is_default = true;
    paymentMethods.set(paymentMethodId, pm);

    return this.sanitizePaymentMethod(pm);
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    const pm = paymentMethods.get(paymentMethodId);
    if (!pm || pm.user_id !== userId) {
      throw new Error('Payment method not found');
    }

    pm.status = 'removed';
    paymentMethods.set(paymentMethodId, pm);

    // If this was the default, set another as default
    if (pm.is_default) {
      const userPMs = userPaymentMethods.get(userId) || [];
      const activePMs = userPMs
        .map(id => paymentMethods.get(id))
        .filter((p): p is PaymentMethod => p !== undefined && p.status === 'active' && p.id !== paymentMethodId);

      if (activePMs.length > 0) {
        activePMs[0].is_default = true;
        paymentMethods.set(activePMs[0].id, activePMs[0]);
      }
    }
  }

  // Sanitize payment method (remove sensitive fields)
  private sanitizePaymentMethod(pm: PaymentMethod): PaymentMethod {
    const { verification_otp, ...sanitized } = pm;
    return sanitized as PaymentMethod;
  }
}

export const paymentMethodService = new PaymentMethodService();
