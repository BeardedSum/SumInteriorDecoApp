import config from '../config';
import axios from 'axios';

/**
 * Notification Service - Email & SMS
 * Supports: SendGrid (Email), Termii (SMS - Nigerian), Twilio (SMS - Global)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface SMSOptions {
  to: string; // Phone number with country code (e.g., +2348012345678)
  message: string;
  provider?: 'termii' | 'twilio';
}

class NotificationService {
  private sendgridApiKey: string;
  private termiiApiKey: string;
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;

  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    this.termiiApiKey = process.env.TERMII_API_KEY || '';
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.sendgridApiKey) {
        console.warn('SendGrid API key not configured, skipping email');
        return false;
      }

      const { to, subject, html, text, from = 'noreply@sumdecor.com' } = options;

      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }], subject }],
          from: { email: from, name: 'Sum Decor AI' },
          content: [
            { type: 'text/html', value: html },
            ...(text ? [{ type: 'text/plain', value: text }] : []),
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Email sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('SendGrid email error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send SMS via Termii (Nigerian-focused)
   */
  async sendSMS(options: SMSOptions): Promise<boolean> {
    const { to, message, provider = 'termii' } = options;

    try {
      if (provider === 'termii') {
        return await this.sendTermiiSMS(to, message);
      } else {
        return await this.sendTwilioSMS(to, message);
      }
    } catch (error: any) {
      console.error('SMS sending error:', error.message);
      return false;
    }
  }

  /**
   * Send SMS via Termii (Primary for Nigerian numbers)
   */
  private async sendTermiiSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.termiiApiKey) {
        console.warn('Termii API key not configured, skipping SMS');
        return false;
      }

      const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
        to,
        from: 'SumDecor',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: this.termiiApiKey,
      });

      console.log('Termii SMS sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('Termii SMS error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send SMS via Twilio (Fallback/International)
   */
  private async sendTwilioSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        console.warn('Twilio credentials not configured, skipping SMS');
        return false;
      }

      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: this.twilioPhoneNumber,
          Body: message,
        }),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('Twilio SMS sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('Twilio SMS error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userEmail: string, userName: string, freeCredits: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #003a6b 0%, #002447 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
          .button { display: inline-block; padding: 15px 30px; background: #42c3f7; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .credits { background: #e7edeb; padding: 20px; border-left: 4px solid #42c3f7; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Welcome to Sum Decor AI!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>Welcome to the future of interior design! We're thrilled to have you join Sum Decor AI.</p>

            <div class="credits">
              <h3>🎁 Your Welcome Gift</h3>
              <p><strong>${freeCredits} Free Credits</strong> have been added to your account!</p>
              <p>Each credit lets you generate a stunning AI-powered interior design. Start transforming your spaces today!</p>
            </div>

            <h3>What You Can Do:</h3>
            <ul>
              <li>✨ Transform any room with AI in 30 seconds</li>
              <li>🎨 Choose from 15+ luxury design styles</li>
              <li>🏠 Virtual staging for empty properties</li>
              <li>🔄 Before/after comparisons</li>
              <li>💼 Professional designs for Nigerian homes</li>
            </ul>

            <center>
              <a href="${config.frontendUrl}/dashboard" class="button">Start Designing →</a>
            </center>

            <p>Need help? Our support team is ready to assist you at support@sumdecor.com</p>

            <p>Happy designing! 🚀</p>
            <p><strong>The Sum Decor AI Team</strong></p>
          </div>
          <div class="footer">
            <p>Sum Decor AI - Luxury Living Redefined with AI</p>
            <p>Abuja, Nigeria | <a href="${config.frontendUrl}">www.sumdecor.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to Sum Decor AI - Your Free Credits Await!',
      html,
      text: `Hi ${userName}, Welcome to Sum Decor AI! You've received ${freeCredits} free credits. Start designing at ${config.frontendUrl}/dashboard`,
    });
  }

  /**
   * Send design completion notification
   */
  async sendDesignCompletedEmail(userEmail: string, userName: string, projectName: string, imageUrl: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #003a6b; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1>✨ Your Design is Ready!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>Hi ${userName},</h2>
          <p>Great news! Your AI-generated design for <strong>"${projectName}"</strong> is ready.</p>

          <div style="text-align: center; margin: 30px 0;">
            <img src="${imageUrl}" alt="Generated Design" style="max-width: 100%; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);" />
          </div>

          <center>
            <a href="${config.frontendUrl}/projects" style="display: inline-block; padding: 15px 30px; background: #42c3f7; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">View Your Design →</a>
          </center>

          <p>Love it? Share it with friends or download it for free!</p>

          <p>Best regards,<br><strong>Sum Decor AI</strong></p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `✨ Your "${projectName}" Design is Ready!`,
      html,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(userEmail: string, userName: string, credits: number, amount: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1>✅ Payment Successful!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2>Hi ${userName},</h2>
          <p>Thank you for your payment! Your credits have been added successfully.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details:</h3>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Credits Added:</strong> ${credits} credits</p>
            <p><strong>Transaction Date:</strong> ${new Date().toLocaleDateString('en-NG')}</p>
          </div>

          <p>Start creating amazing designs with your new credits!</p>

          <center>
            <a href="${config.frontendUrl}/create" style="display: inline-block; padding: 15px 30px; background: #003a6b; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Start Designing →</a>
          </center>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: '✅ Payment Confirmed - Credits Added!',
      html,
    });
  }

  /**
   * Send OTP via SMS
   */
  async sendOTPSMS(phoneNumber: string, otp: string): Promise<boolean> {
    const message = `Your Sum Decor AI verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    return await this.sendSMS({ to: phoneNumber, message, provider: 'termii' });
  }
}

export default new NotificationService();
