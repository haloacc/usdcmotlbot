import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { CreateUserRequest, LoginRequest, VerifyOTPRequest } from '../models/user';

export class AuthController {
  // POST /api/auth/signup
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, mobile, password, first_name, last_name } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
        return;
      }

      const createUserReq: CreateUserRequest = {
        email,
        mobile,
        password,
        first_name,
        last_name,
        mobile_verified: req.body.mobile_verified || false, // Set if verified via inline OTP
      };

      const { user, session, email_verification_token, mobile_otp } = await userService.createUser(createUserReq);

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Please check your email to verify before logging in.',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          mobile_verified: user.mobile_verified,
        },
        // No session token - must verify email and login
      });
    } catch (error: any) {
      console.error('[AuthController] Signup error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user',
      });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const loginReq: LoginRequest = { email, password };
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const { user, session } = await userService.login(loginReq, ipAddress, userAgent);

      // Check email verification
      if (!user.email_verified) {
        res.status(403).json({
          success: false,
          error: 'Please verify your email before logging in. Check your inbox for the verification link.',
          requires_email_verification: true,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Login successful',
        user,
        session: {
          token: session.token,
          expires_at: session.expires_at,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  // GET/POST /api/auth/verify-email - handles both email links and API calls
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const token = (req.query.token as string) || req.body.token;
      const user_id = req.body.user_id;

      if (!token && !user_id) {
        res.status(400).json({
          success: false,
          error: 'Verification token is required',
        });
        return;
      }

      // Support both methods: token only (from email) or user_id + token (from app)
      const user = await userService.verifyEmail(user_id || token, user_id ? token : undefined);

      // If it's a GET request (from email link), show HTML page
      if (req.method === 'GET') {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verified - Halo</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { background: white; padding: 3rem; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); animation: slideUp 0.5s ease; }
              @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
              .success-icon { font-size: 5rem; margin-bottom: 1.5rem; animation: bounce 0.6s ease; }
              @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
              h1 { color: #111827; font-size: 2rem; margin-bottom: 0.5rem; }
              p { color: #6b7280; font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6; }
              .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 1rem; transition: transform 0.2s, box-shadow 0.2s; }
              .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4); }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>Email Verified!</h1>
              <p>Your email has been successfully verified. You can now access all features of your Halo account.</p>
              <a href="/login.html" class="btn">Go to Login</a>
            </div>
          </body>
          </html>
        `);
      } else {
        // API response for POST requests
        res.json({
          success: true,
          message: 'Email verified successfully',
          user,
        });
      }
    } catch (error: any) {
      console.error('[AuthController] Email verification error:', error);

      if (req.method === 'GET') {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Verification Failed - Halo</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { background: white; padding: 3rem; border-radius: 20px; text-align: center; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
              .error-icon { font-size: 5rem; margin-bottom: 1.5rem; }
              h1 { color: #ef4444; font-size: 2rem; margin-bottom: 0.5rem; }
              p { color: #6b7280; font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6; }
              .btn { display: inline-block; background: #6b7280; color: white; padding: 14px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">❌</div>
              <h1>Verification Failed</h1>
              <p>${error.message || 'Invalid or expired verification link'}</p>
              <a href="/signup.html" class="btn">Back to Signup</a>
            </div>
          </body>
          </html>
        `);
      } else {
        res.status(400).json({
          success: false,
          error: error.message || 'Verification failed',
        });
      }
    }
  }

  // POST /api/auth/send-otp - Send OTP before signup
  async sendOTPBeforeSignup(req: Request, res: Response): Promise<void> {
    try {
      const { mobile } = req.body;

      if (!mobile) {
        res.status(400).json({
          success: false,
          error: 'Mobile number is required',
        });
        return;
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in session or temporary storage (using sessionStorage on frontend)
      // Send OTP via SMS
      const { smsService } = await import('../services/smsService');
      await smsService.sendOTP(mobile, otp);

      res.json({
        success: true,
        message: 'OTP sent successfully',
        otp_for_dev: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    } catch (error: any) {
      console.error('[AuthController] Send OTP error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send OTP',
      });
    }
  }

  // POST /api/auth/verify-mobile
  async verifyMobile(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, otp } = req.body;

      if (!user_id || !otp) {
        res.status(400).json({
          success: false,
          error: 'User ID and OTP are required',
        });
        return;
      }

      const verifyReq: VerifyOTPRequest = {
        user_id,
        otp,
        type: 'mobile',
      };

      const user = await userService.verifyMobileOTP(verifyReq);

      res.json({
        success: true,
        message: 'Mobile verified successfully',
        user,
      });
    } catch (error: any) {
      console.error('[AuthController] Mobile verification error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Verification failed',
      });
    }
  }

  // POST /api/auth/resend-otp
  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const result = await userService.resendOTP(user_id);

      res.json({
        success: true,
        message: 'OTP sent successfully. Please check your phone.',
      });
    } catch (error: any) {
      console.error('[AuthController] Resend OTP error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend OTP',
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        // If no token, user is already logged out or session invalid. 
        // Treat as success to avoid frontend errors.
        res.json({
          success: true,
          message: 'Logged out successfully',
        });
        return;
      }

      await userService.logout(token);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('[AuthController] Logout error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Logout failed',
      });
    }
  }

  // GET /api/auth/me (get current user)
  async getCurrentUser(req: Request, res: Response): Promise<void> {
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

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.error('[AuthController] Get current user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user',
      });
    }
  }
}

export const authController = new AuthController();
