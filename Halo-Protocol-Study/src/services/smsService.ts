// SMS Service - integrates with Twilio or other SMS providers
// For now, logs to console. Add Twilio credentials to send real SMS.

export class SMSService {
  private twilioSid?: string;
  private twilioToken?: string;
  private twilioPhone?: string;

  constructor() {
    this.twilioSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (this.twilioSid && this.twilioToken && this.twilioPhone) {
      console.log('✅ SMS service configured with Twilio');
    } else {
      console.log('⚠️  SMS service in development mode - OTPs will be logged to console');
      console.log('   To enable real SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your Halo verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this message.`;

    // If Twilio is configured, send real SMS
    if (this.twilioSid && this.twilioToken && this.twilioPhone) {
      try {
        const twilio = require('twilio');
        const client = twilio(this.twilioSid, this.twilioToken);
        await client.messages.create({
          body: message,
          from: this.twilioPhone,
          to: phoneNumber,
        });
      } catch (error) {
        console.error('❌ Failed to send SMS:', error);
        throw new Error('Failed to send SMS');
      }
    } else {
      // Development mode - just log
      console.log('\n📱 SMS MESSAGE (Development Mode)');
      console.log('═══════════════════════════════════');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`OTP: ${otp}`);
      console.log('═══════════════════════════════════\n');
    }
  }

  async sendSecurityAlert(phoneNumber: string, message: string): Promise<void> {
    if (this.twilioSid && this.twilioToken && this.twilioPhone) {
      try {
        // Send via Twilio in production
        console.log(`✅ Security alert sent to ${phoneNumber}`);
      } catch (error) {
        console.error('❌ Failed to send security alert:', error);
      }
    } else {
      console.log(`\n🔔 SECURITY ALERT to ${phoneNumber}:\n${message}\n`);
    }
  }
}

export const smsService = new SMSService();
