import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // Configure with environment variables or use Gmail SMTP
    // For production, use SendGrid, AWS SES, or other service
    const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
    const emailPass = process.env.EMAIL_PASSWORD || 'your-app-password';
    this.fromEmail = process.env.EMAIL_FROM || 'Halo <noreply@halofy.ai>';

    // For development, you can use Gmail with an app password
    // Or use a service like Ethereal for testing
    if (process.env.NODE_ENV === 'production' && emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      // For development, just log to console
      console.log('⚠️  Email service in development mode - emails will be logged to console');
      // No actual transporter in dev mode - we'll just log URLs
      this.transporter = null as any;
    }
  }
  async sendOrderConfirmation(
    email: string,
    orderDetails: {
      orderNumber: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      orderDate: string;
    }
  ): Promise<void> {
    const itemsHtml = orderDetails.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header .icon { font-size: 60px; margin-bottom: 15px; }
          .content { padding: 40px; }
          .order-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info p { margin: 8px 0; color: #374151; }
          .order-info strong { color: #111827; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #f9fafb; padding: 12px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase; }
          .totals { margin-top: 30px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; color: #6b7280; }
          .totals-row.total { border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 10px; font-size: 20px; font-weight: 700; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">✅</div>
            <h1>Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.95;">Thank you for your purchase, ${orderDetails.customerName}</p>
          </div>
          
          <div class="content">
            <p>Your order has been successfully processed and confirmed.</p>
            
            <div class="order-info">
              <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
              <p><strong>Order Date:</strong> ${orderDetails.orderDate}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>

            <h2 style="color: #111827; margin-top: 30px;">Order Details</h2>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>$${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Shipping</span>
                <span>$${orderDetails.shipping.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Tax</span>
                <span>$${orderDetails.tax.toFixed(2)}</span>
              </div>
              <div class="totals-row total">
                <span>Total Paid</span>
                <span>$${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/products.html" class="button">Continue Shopping</a>
            </div>
          </div>

          <div class="footer">
            <p>Questions? Contact us at <a href="mailto:support@halofy.ai" style="color: #10b981;">support@halofy.ai</a></p>
            <p style="margin-top: 15px; font-size: 12px;">© 2026 Halo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: `Order Confirmation - ${orderDetails.orderNumber}`,
        html: htmlContent,
      });
      console.log(`✅ Order confirmation email sent to ${email}`);
    } else {
      console.log('\n=== ORDER CONFIRMATION EMAIL (Dev Mode) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Order Confirmation - ${orderDetails.orderNumber}`);
      console.log(`Order: ${orderDetails.orderNumber}`);
      console.log(`Total: $${orderDetails.total.toFixed(2)}`);
      console.log('===========================================\n');
    }
  }
  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .code-box { background: #f9fafb; border: 2px dashed #d1d5db; padding: 15px; margin: 20px 0; border-radius: 6px; text-align: center; }
          .code { font-family: 'Courier New', monospace; font-size: 14px; color: #111827; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Halo!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>Thank you for signing up for Halo. Please verify your email address to activate your account.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <div class="code-box">
              <div class="code">${verificationUrl}</div>
            </div>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create a Halo account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Halo - Agentic Commerce Platform</p>
            <p>Powered by multi-protocol payment orchestration</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Halo!

Hi ${firstName || 'there'},

Thank you for signing up. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create a Halo account, you can safely ignore this email.

---
Halo - Agentic Commerce Platform
    `;

    // In development mode, just log the URL
    if (!this.transporter || process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL VERIFICATION LINK:');
      console.log('══════════════════════════════════════════════════');
      console.log(`To: ${email}`);
      console.log(`Click to verify: ${verificationUrl}`);
      console.log('══════════════════════════════════════════════════\n');
      return;
    }

    // Production: actually send email
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your Halo account',
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Halo - Agentic Commerce Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your Halo password',
        html: htmlContent,
      });

      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = new EmailService();
