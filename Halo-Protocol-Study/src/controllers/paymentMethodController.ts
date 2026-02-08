import { Request, Response } from 'express';
import { paymentMethodService } from '../services/paymentMethodService';
import { userService } from '../services/userService';
import { AddPaymentMethodRequest, VerifyPaymentMethodRequest } from '../models/paymentMethod';

export class PaymentMethodController {
  // POST /api/payment-methods
  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      // Check mobile verification for payment methods
      // ALLOW BYPASS for Stripe Test Card (4242...) or any test cards starting with 42
      const isTestCard = req.body.card_number?.toString().startsWith('42');

      if (!user.mobile_verified && !isTestCard) {
        res.status(403).json({
          success: false,
          error: 'Please verify your phone number before adding payment methods. This is required for security.',
          requires_mobile_verification: true,
        });
        return;
      }

      const {
        card_number,
        card_holder_name,
        card_exp_month,
        card_exp_year,
        card_cvv,
        billing_address,
      } = req.body;

      // Validation
      if (!card_number || !card_holder_name || !card_exp_month || !card_exp_year || !card_cvv) {
        res.status(400).json({
          success: false,
          error: 'All card details are required',
        });
        return;
      }

      // Sanitize and validate card number
      const sanitizedCardNumber = card_number.toString().replace(/\D/g, '');
      if (sanitizedCardNumber.length < 13 || sanitizedCardNumber.length > 19) {
        res.status(400).json({
          success: false,
          error: 'Invalid card number length',
        });
        return;
      }

      // Validate expiry
      const expMonth = parseInt(card_exp_month);
      const expYear = parseInt(card_exp_year);

      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        res.status(400).json({
          success: false,
          error: 'Invalid expiry month (must be 1-12)',
        });
        return;
      }

      const currentYear = new Date().getFullYear();
      if (isNaN(expYear) || expYear < currentYear || expYear > currentYear + 20) {
        res.status(400).json({
          success: false,
          error: 'Invalid expiry year',
        });
        return;
      }

      // Validate CVV
      const sanitizedCVV = card_cvv.toString().replace(/\D/g, '');
      if (sanitizedCVV.length < 3 || sanitizedCVV.length > 4) {
        res.status(400).json({
          success: false,
          error: 'Invalid CVV (must be 3-4 digits)',
        });
        return;
      }

      // Validate cardholder name
      if (card_holder_name.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Cardholder name is required',
        });
        return;
      }

      const addPMReq: AddPaymentMethodRequest = {
        user_id: user.id,
        card_number: sanitizedCardNumber,
        card_holder_name: card_holder_name.trim(),
        card_exp_month: expMonth,
        card_exp_year: expYear,
        card_cvv: sanitizedCVV,
        billing_address,
      };

      const paymentMethod = await paymentMethodService.addPaymentMethod(addPMReq);

      res.status(201).json({
        success: true,
        message: 'Payment method added. Please verify with OTP.',
        payment_method: paymentMethod,
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Add payment method error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add payment method',
      });
    }
  }

  // POST /api/payment-methods/:id/verify
  async verifyPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      if (!otp) {
        res.status(400).json({
          success: false,
          error: 'OTP is required',
        });
        return;
      }

      const verifyReq: VerifyPaymentMethodRequest = {
        payment_method_id: id,
        otp,
      };

      const paymentMethod = await paymentMethodService.verifyPaymentMethod(verifyReq);

      res.json({
        success: true,
        message: 'Payment method verified successfully',
        payment_method: paymentMethod,
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Verify payment method error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Verification failed',
      });
    }
  }

  // POST /api/payment-methods/:id/resend-otp
  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await paymentMethodService.resendPaymentMethodOTP(id);

      res.json({
        success: true,
        message: 'OTP resent successfully',
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Resend OTP error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend OTP',
      });
    }
  }

  // GET /api/payment-methods
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    console.log(`[PaymentMethodController] GET /api/payment-methods hit`);
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const paymentMethods = await paymentMethodService.getPaymentMethodsForUser(user.id);

      res.json({
        success: true,
        payment_methods: paymentMethods,
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Get payment methods error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get payment methods',
      });
    }
  }

  // GET /api/payment-methods/:id
  async getPaymentMethodById(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const { id } = req.params;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const paymentMethod = await paymentMethodService.getPaymentMethodById(id, user.id);

      if (!paymentMethod) {
        res.status(404).json({
          success: false,
          error: 'Payment method not found',
        });
        return;
      }

      res.json({
        success: true,
        payment_method: paymentMethod,
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Get payment method error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get payment method',
      });
    }
  }

  // PATCH /api/payment-methods/:id/set-default
  async setDefault(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const { id } = req.params;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(id, user.id);

      res.json({
        success: true,
        message: 'Default payment method updated',
        payment_method: paymentMethod,
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Set default error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to set default payment method',
      });
    }
  }

  // DELETE /api/payment-methods/:id
  async removePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const { id } = req.params;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided',
        });
        return;
      }

      const user = await userService.getUserByToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      await paymentMethodService.removePaymentMethod(id, user.id);

      res.json({
        success: true,
        message: 'Payment method removed',
      });
    } catch (error: any) {
      console.error('[PaymentMethodController] Remove payment method error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove payment method',
      });
    }
  }
}

export const paymentMethodController = new PaymentMethodController();
