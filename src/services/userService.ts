import { User, UserSession, CreateUserRequest, LoginRequest, VerifyOTPRequest } from '../models/user';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { emailService } from './emailService';
import { smsService } from './smsService';

// In-memory stores (replace with database in production)
export const users = new Map<string, User>();
export const sessions = new Map<string, UserSession>();
export const usersByEmail = new Map<string, string>(); // email -> user_id

class UserService {
  // Find or create OAuth user
  async findOrCreateUserFromOAuth(oauthData: {
    email: string;
    first_name?: string;
    last_name?: string;
    email_verified?: boolean;
    provider: string;
    provider_id: string;
  }): Promise<User> {
    // Check if user exists by email
    let userId = usersByEmail.get(oauthData.email);
    
    if (userId) {
      return users.get(userId)!;
    }

    // Create new OAuth user
    userId = `oauth_${oauthData.provider}_${oauthData.provider_id}`;
    const user: User = {
      id: userId,
      email: oauthData.email,
      first_name: oauthData.first_name,
      last_name: oauthData.last_name,
      email_verified: !!oauthData.email_verified,
      mobile_verified: false,
      password_hash: '', // OAuth users don't have passwords
      created_at: new Date(),
      updated_at: new Date(),
      status: 'active',
    };

    users.set(userId, user);
    usersByEmail.set(oauthData.email, userId);
    
    return this.sanitizeUser(user);
  }

  // Generate OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate session token
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Create user
  async createUser(req: CreateUserRequest): Promise<{ user: User; session: UserSession; email_verification_token: string; mobile_otp?: string }> {
    // Check if email exists
    if (usersByEmail.has(req.email)) {
      throw new Error('Email already registered');
    }

    // Create user
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = await this.hashPassword(req.password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const mobileOTP = req.mobile ? this.generateOTP() : undefined;

    const user: User = {
      id: userId,
      email: req.email,
      mobile: req.mobile,
      password_hash: passwordHash,
      first_name: req.first_name,
      last_name: req.last_name,
      email_verified: false,
      mobile_verified: req.mobile_verified || false, // Set true if already verified via inline OTP
      email_verification_token: emailVerificationToken,
      mobile_otp: mobileOTP,
      mobile_otp_expires: mobileOTP ? new Date(Date.now() + 10 * 60 * 1000) : undefined, // 10 min
      created_at: new Date(),
      updated_at: new Date(),
      status: 'pending_verification',
    };

    users.set(userId, user);
    usersByEmail.set(req.email, userId);

    // Create session
    const session = this.createSession(userId);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(req.email, emailVerificationToken, req.first_name);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail signup if email fails
    }

    // Send OTP SMS only if not already verified
    if (req.mobile && mobileOTP && !req.mobile_verified) {
      try {
        await smsService.sendOTP(req.mobile, mobileOTP);
      } catch (error) {
        console.error('Failed to send OTP SMS:', error);
        // Don't fail signup if SMS fails
      }
    }

    return { 
      user: this.sanitizeUser(user), 
      session,
      email_verification_token: emailVerificationToken,
      mobile_otp: mobileOTP,
    };
  }

  // Create session
  createSession(userId: string, ipAddress?: string, userAgent?: string): UserSession {
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: UserSession = {
      session_id: sessionId,
      user_id: userId,
      token,
      created_at: new Date(),
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    sessions.set(token, session);
    return session;
  }

  // Login
  async login(req: LoginRequest, ipAddress?: string, userAgent?: string): Promise<{ user: User; session: UserSession }> {
    const userId = usersByEmail.get(req.email);
    if (!userId) {
      throw new Error('Invalid email or password');
    }

    const user = users.get(userId);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(req.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (user.status === 'suspended') {
      throw new Error('Account suspended');
    }

    // Update last login
    user.last_login = new Date();
    users.set(userId, user);

    // Create session
    const session = this.createSession(userId, ipAddress, userAgent);

    return { user: this.sanitizeUser(user), session };
  }

  // Verify email (can work with just token or user_id + token)
  async verifyEmail(userIdOrToken: string, token?: string): Promise<User> {
    let user: User | undefined;
    
    // If token is provided separately, use userId + token (old method)
    if (token) {
      user = users.get(userIdOrToken);
      if (!user || user.email_verification_token !== token) {
        throw new Error('Invalid verification token');
      }
    } else {
      // Find user by token (new method - for email links)
      const allUsers = Array.from(users.values());
      user = allUsers.find(u => u.email_verification_token === userIdOrToken);
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }
    }

    user.email_verified = true;
    user.email_verification_token = undefined;
    user.status = user.mobile_verified || !user.mobile ? 'active' : 'pending_verification';
    user.updated_at = new Date();

    users.set(user.id, user);
    return this.sanitizeUser(user);
  }

  // Verify mobile OTP
  async verifyMobileOTP(req: VerifyOTPRequest): Promise<User> {
    const user = users.get(req.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mobile_otp || !user.mobile_otp_expires) {
      throw new Error('No OTP pending');
    }

    if (user.mobile_otp_expires < new Date()) {
      throw new Error('OTP expired');
    }

    if (user.mobile_otp !== req.otp) {
      throw new Error('Invalid OTP');
    }

    user.mobile_verified = true;
    user.mobile_otp = undefined;
    user.mobile_otp_expires = undefined;
    user.status = user.email_verified ? 'active' : 'pending_verification';
    user.updated_at = new Date();

    users.set(req.user_id, user);
    return this.sanitizeUser(user);
  }

  // Resend OTP
  async resendOTP(userId: string): Promise<{ success: boolean; message: string; otp?: string }> {
    const user = users.get(userId);
    if (!user || !user.mobile) {
      throw new Error('User not found or no mobile number');
    }

    const otp = this.generateOTP();
    user.mobile_otp = otp;
    user.mobile_otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    users.set(userId, user);

    // Send OTP SMS
    try {
      await smsService.sendOTP(user.mobile!, otp);
    } catch (error) {
      console.error('Failed to send OTP SMS:', error);
    }
    
    return { success: true, message: 'OTP sent successfully', otp };
  }

  // Get user by token
  async getUserByToken(token: string): Promise<User | null> {
    const session = sessions.get(token);
    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expires_at < new Date()) {
      sessions.delete(token);
      return null;
    }

    const user = users.get(session.user_id);
    return user ? this.sanitizeUser(user) : null;
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const user = users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Pick<User, 'first_name' | 'last_name' | 'mobile'>>): Promise<User> {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If updating mobile, require re-verification
    if (updates.mobile && updates.mobile !== user.mobile) {
      const otp = this.generateOTP();
      user.mobile = updates.mobile;
      user.mobile_verified = false;
      user.mobile_otp = otp;
      user.mobile_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
      console.log(`[UserService] OTP sent to new mobile ${updates.mobile}: ${otp}`);
    }

    if (updates.first_name !== undefined) user.first_name = updates.first_name;
    if (updates.last_name !== undefined) user.last_name = updates.last_name;

    user.updated_at = new Date();
    users.set(userId, user);

    return this.sanitizeUser(user);
  }

  // Logout
  async logout(token: string): Promise<void> {
    sessions.delete(token);
  }

  // Sanitize user (remove sensitive fields)
  private sanitizeUser(user: User): User {
    const { password_hash, email_verification_token, mobile_otp, ...sanitized } = user;
    return sanitized as User;
  }
}

export const userService = new UserService();
