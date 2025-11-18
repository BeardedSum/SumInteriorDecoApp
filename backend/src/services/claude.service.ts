import Anthropic from '@anthropic-ai/sdk';
import config from '../config';

/**
 * Claude Sonnet 4 Service
 * For advanced text understanding and design consultation
 */

interface DesignConsultationResult {
  analysis: string;
  recommendations: string[];
  estimatedBudget?: {
    low: number;
    medium: number;
    high: number;
    currency: string;
  };
  timeline?: string;
}

interface PromptOptimizationResult {
  optimizedPrompt: string;
  reasoning: string;
  additionalSuggestions: string[];
}

class ClaudeService {
  private client: Anthropic;

  constructor() {
    if (!config.anthropic.apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  /**
   * Provide design consultation based on user requirements
   */
  async provideDesignConsultation(
    userRequirements: string,
    roomType: string,
    budget?: number,
    preferences?: string[]
  ): Promise<DesignConsultationResult> {
    try {
      const prompt = `You are a professional interior designer providing consultation for a Nigerian client.

Room Type: ${roomType}
User Requirements: ${userRequirements}
${budget ? `Budget: ₦${budget.toLocaleString()}` : 'Budget: Not specified'}
${preferences && preferences.length > 0 ? `Preferences: ${preferences.join(', ')}` : ''}

Please provide:
1. A detailed analysis of their requirements
2. Specific design recommendations (at least 5 actionable items)
3. Estimated budget breakdown (if budget provided, optimize for it; otherwise suggest low/medium/high options in Nigerian Naira)
4. Realistic timeline for implementation

Consider Nigerian context: local materials, climate, available furniture brands (like HomeEdge, AfricanHeritage, etc.), and cultural aesthetics.

Format your response as JSON:
{
  "analysis": "detailed analysis text",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "estimatedBudget": {
    "low": number,
    "medium": number,
    "high": number,
    "currency": "NGN"
  },
  "timeline": "estimated timeline text"
}`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const consultation: DesignConsultationResult = JSON.parse(jsonMatch[0]);
      return consultation;
    } catch (error: any) {
      console.error('Claude consultation error:', error);
      throw new Error(`Design consultation failed: ${error.message}`);
    }
  }

  /**
   * Optimize user prompt for better AI generation results
   */
  async optimizePrompt(
    userPrompt: string,
    stylePreset: string,
    roomType: string
  ): Promise<PromptOptimizationResult> {
    try {
      const prompt = `You are an expert at crafting prompts for AI image generation systems (like SDXL, Midjourney).

User's original prompt: "${userPrompt}"
Target style: ${stylePreset}
Room type: ${roomType}

Create an optimized prompt that will generate the best possible interior design image. The optimized prompt should:
1. Be detailed and specific
2. Include relevant design elements, colors, materials
3. Specify lighting conditions
4. Include quality keywords (photorealistic, high resolution, professional photography, etc.)
5. Be culturally appropriate for Nigerian/African context if relevant

Also provide:
- Your reasoning for the optimization
- Additional suggestions for the user

Format as JSON:
{
  "optimizedPrompt": "the optimized prompt text",
  "reasoning": "why you made these changes",
  "additionalSuggestions": ["suggestion 1", "suggestion 2", ...]
}`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const result: PromptOptimizationResult = JSON.parse(jsonMatch[0]);
      return result;
    } catch (error: any) {
      console.error('Claude prompt optimization error:', error);
      // Fallback
      return {
        optimizedPrompt: userPrompt,
        reasoning: 'Failed to optimize prompt',
        additionalSuggestions: [],
      };
    }
  }

  /**
   * Generate creative design ideas
   */
  async generateDesignIdeas(
    roomType: string,
    style: string,
    constraints?: string[]
  ): Promise<string[]> {
    try {
      const prompt = `Generate 5 creative interior design ideas for a ${roomType} in ${style} style.
${constraints && constraints.length > 0 ? `Constraints: ${constraints.join(', ')}` : ''}

Consider Nigerian/African context where relevant.

Return as a JSON array of strings, where each string is a complete, detailed design idea (2-3 sentences each).
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const ideas: string[] = JSON.parse(jsonMatch[0]);
      return ideas;
    } catch (error: any) {
      console.error('Claude idea generation error:', error);
      return [];
    }
  }

  /**
   * Analyze user intent from natural language
   */
  async analyzeUserIntent(userMessage: string): Promise<{
    intent: 'redesign' | 'staging' | 'consultation' | 'question' | 'other';
    extractedInfo: {
      roomType?: string;
      style?: string;
      budget?: number;
      urgency?: 'low' | 'medium' | 'high';
      specificRequests?: string[];
    };
  }> {
    try {
      const prompt = `Analyze this user message and determine their intent:
"${userMessage}"

Determine:
1. Primary intent: redesign, staging, consultation, question, or other
2. Extract any mentioned room type, style preferences, budget, urgency level, and specific requests

Return as JSON:
{
  "intent": "redesign|staging|consultation|question|other",
  "extractedInfo": {
    "roomType": "string or null",
    "style": "string or null",
    "budget": number or null,
    "urgency": "low|medium|high or null",
    "specificRequests": ["request1", "request2", ...] or []
  }
}`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error('Claude intent analysis error:', error);
      return {
        intent: 'other',
        extractedInfo: {},
      };
    }
  }

  /**
   * Generate furniture shopping recommendations
   */
  async generateShoppingList(
    designDescription: string,
    budget: number
  ): Promise<{
    items: Array<{
      item: string;
      estimatedPrice: number;
      priority: 'essential' | 'recommended' | 'optional';
      localStores: string[];
    }>;
    totalEstimate: number;
  }> {
    try {
      const prompt = `Based on this interior design:
"${designDescription}"

Budget: ₦${budget.toLocaleString()}

Create a shopping list with:
- Specific furniture and decor items
- Estimated prices in Nigerian Naira
- Priority level (essential/recommended/optional)
- Where to buy in Nigeria (stores like Jumia, Konga, HomeEdge, AfricanHeritage, local markets, etc.)

Stay within budget. Format as JSON:
{
  "items": [
    {
      "item": "item name and description",
      "estimatedPrice": number,
      "priority": "essential|recommended|optional",
      "localStores": ["store1", "store2", ...]
    }
  ],
  "totalEstimate": number
}`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3072,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error('Claude shopping list error:', error);
      throw new Error(`Shopping list generation failed: ${error.message}`);
    }
  }
}

export default new ClaudeService();
