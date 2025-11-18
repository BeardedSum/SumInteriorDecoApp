import axios from 'axios';
import config from '../config';

/**
 * WhatsApp Business API Service
 * For sharing designs, updates, and customer support via WhatsApp
 */

interface WhatsAppMessageOptions {
  to: string; // Phone number with country code (e.g., 2348012345678)
  message: string;
  imageUrl?: string;
  caption?: string;
}

interface WhatsAppTemplateOptions {
  to: string;
  templateName: string;
  parameters: string[];
  mediaUrl?: string;
}

class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private accessToken: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Send text message via WhatsApp
   */
  async sendMessage(options: WhatsAppMessageOptions): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('WhatsApp credentials not configured, skipping message');
        return false;
      }

      const { to, message } = options;

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp message sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('WhatsApp message error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send image with caption via WhatsApp
   */
  async sendImage(options: WhatsAppMessageOptions): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('WhatsApp credentials not configured');
        return false;
      }

      const { to, imageUrl, caption } = options;

      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption || '',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp image sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('WhatsApp image error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send template message (pre-approved by WhatsApp)
   */
  async sendTemplate(options: WhatsAppTemplateOptions): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('WhatsApp credentials not configured');
        return false;
      }

      const { to, templateName, parameters, mediaUrl } = options;

      const components: any[] = [
        {
          type: 'body',
          parameters: parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        },
      ];

      // Add media header if provided
      if (mediaUrl) {
        components.unshift({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: { link: mediaUrl },
            },
          ],
        });
      }

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('WhatsApp template sent successfully to:', to);
      return true;
    } catch (error: any) {
      console.error('WhatsApp template error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Share design completion via WhatsApp
   */
  async shareDesignCompletion(phoneNumber: string, userName: string, projectName: string, imageUrl: string): Promise<boolean> {
    const caption = `🎨 Hi ${userName}! Your "${projectName}" design is ready! ✨\n\nView and download at: ${config.frontendUrl}/projects\n\n- Sum Decor AI`;

    return await this.sendImage({
      to: phoneNumber,
      imageUrl,
      caption,
    });
  }

  /**
   * Send before/after comparison
   */
  async shareBeforeAfter(phoneNumber: string, beforeImageUrl: string, afterImageUrl: string, projectName: string): Promise<boolean> {
    // Send before image
    await this.sendImage({
      to: phoneNumber,
      imageUrl: beforeImageUrl,
      caption: `📸 Before: ${projectName}`,
    });

    // Wait a bit to ensure proper ordering
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send after image
    return await this.sendImage({
      to: phoneNumber,
      imageUrl: afterImageUrl,
      caption: `✨ After: ${projectName}\n\nAmazing transformation! 🎨`,
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phoneNumber: string, userName: string, creditsRemaining: number): Promise<boolean> {
    const message = `Hi ${userName}! 👋\n\nYou have ${creditsRemaining} credits remaining.\n\nTop up now to keep creating stunning designs! 💎\n\nVisit: ${config.frontendUrl}/account/credits\n\n- Sum Decor AI`;

    return await this.sendMessage({ to: phoneNumber, message });
  }

  /**
   * Send generation status update
   */
  async sendGenerationUpdate(phoneNumber: string, status: 'processing' | 'completed' | 'failed', projectName: string): Promise<boolean> {
    let message = '';

    switch (status) {
      case 'processing':
        message = `⚙️ Your "${projectName}" design is being generated...\n\nETA: 30 seconds. We'll notify you when it's ready! ✨`;
        break;
      case 'completed':
        message = `✅ Your "${projectName}" design is ready!\n\nView it now: ${config.frontendUrl}/projects\n\n🎨 Sum Decor AI`;
        break;
      case 'failed':
        message = `❌ Oops! There was an issue generating "${projectName}".\n\nYour credits have been refunded. Please try again or contact support.\n\n- Sum Decor AI`;
        break;
    }

    return await this.sendMessage({ to: phoneNumber, message });
  }

  /**
   * Handle incoming webhook messages from WhatsApp
   */
  async handleIncomingMessage(payload: any): Promise<void> {
    try {
      const { entry } = payload;

      if (!entry || !entry[0]?.changes) {
        return;
      }

      const changes = entry[0].changes[0];
      const value = changes.value;

      if (!value.messages || value.messages.length === 0) {
        return;
      }

      const message = value.messages[0];
      const from = message.from;
      const messageText = message.text?.body?.toLowerCase() || '';

      console.log(`Received WhatsApp message from ${from}: ${messageText}`);

      // Simple command handling
      if (messageText.includes('status') || messageText.includes('help')) {
        await this.sendMessage({
          to: from,
          message: `👋 Hi! I'm Sum Decor AI Bot.\n\nHere's how I can help:\n\n📊 Check credits\n🎨 View designs\n💳 Buy credits\n📞 Contact support\n\nVisit: ${config.frontendUrl}`,
        });
      } else if (messageText.includes('credit')) {
        await this.sendMessage({
          to: from,
          message: `💎 Check your credits at: ${config.frontendUrl}/account\n\nNeed more? Top up here: ${config.frontendUrl}/account/credits`,
        });
      } else {
        // Default response
        await this.sendMessage({
          to: from,
          message: `Thanks for reaching out! 🎨\n\nFor quick help, reply with:\n- "status" - Check account\n- "credit" - View credits\n\nOr visit: ${config.frontendUrl}`,
        });
      }
    } catch (error: any) {
      console.error('WhatsApp webhook handling error:', error);
    }
  }

  /**
   * Generate shareable WhatsApp link for design
   */
  generateShareLink(projectName: string, imageUrl: string): string {
    const message = encodeURIComponent(
      `Check out my "${projectName}" interior design created with Sum Decor AI! 🎨✨\n\n${imageUrl}\n\nCreate your own at: ${config.frontendUrl}`
    );

    return `https://wa.me/?text=${message}`;
  }

  /**
   * Send bulk messages (for marketing - use sparingly and with consent!)
   */
  async sendBulkMessages(phoneNumbers: string[], message: string, delayMs: number = 2000): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        const result = await this.sendMessage({ to: phoneNumber, message });
        if (result) {
          success++;
        } else {
          failed++;
        }

        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        failed++;
        console.error(`Failed to send to ${phoneNumber}:`, error);
      }
    }

    console.log(`Bulk send completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }
}

export default new WhatsAppService();
