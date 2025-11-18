import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import fs from 'fs';
import path from 'path';

/**
 * Google Gemini 2.0 Flash Service
 * For image analysis and understanding
 */

interface ImageAnalysisResult {
  roomType: string;
  detectedObjects: string[];
  currentStyle: string;
  colorScheme: string[];
  lightingAssessment: string;
  suggestedImprovements: string[];
  confidence: number;
}

interface DesignFeedbackResult {
  overallQuality: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  styleAccuracy: number; // 1-10
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!config.googleAI.apiKey) {
      throw new Error('Google AI API key is not configured');
    }

    this.genAI = new GoogleGenerativeAI(config.googleAI.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Analyze an interior design image
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    try {
      // Download image and convert to base64
      const imageData = await this.getImageAsBase64(imageUrl);

      const prompt = `You are an expert interior designer analyzing this room image. Provide a detailed analysis in JSON format with the following structure:
      {
        "roomType": "the type of room (living_room, bedroom, kitchen, etc.)",
        "detectedObjects": ["list of furniture and objects you see"],
        "currentStyle": "the current interior design style",
        "colorScheme": ["dominant colors in the room"],
        "lightingAssessment": "description of the lighting (natural/artificial, quality, etc.)",
        "suggestedImprovements": ["list of improvement suggestions"],
        "confidence": 0.0-1.0 (your confidence in this analysis)
      }

      Be specific and professional. Focus on design elements that would be relevant for AI-powered redesign.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Gemini response');
      }

      const analysis: ImageAnalysisResult = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error: any) {
      console.error('Gemini image analysis error:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Get design feedback on a generated image
   */
  async getDesignFeedback(
    originalImageUrl: string,
    generatedImageUrl: string,
    targetStyle: string
  ): Promise<DesignFeedbackResult> {
    try {
      const originalImage = await this.getImageAsBase64(originalImageUrl);
      const generatedImage = await this.getImageAsBase64(generatedImageUrl);

      const prompt = `You are an expert interior designer. Compare these two images:
      1. Original image (before)
      2. Generated image (after redesign with style: "${targetStyle}")

      Provide professional feedback in JSON format:
      {
        "overallQuality": 1-10 (how good is the redesign?),
        "strengths": ["what works well in the redesign"],
        "weaknesses": ["what could be improved"],
        "suggestions": ["specific suggestions for improvement"],
        "styleAccuracy": 1-10 (how well does it match the ${targetStyle} style?)
      }

      Be constructive and specific.`;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: originalImage.mimeType,
            data: originalImage.base64,
          },
        },
        {
          inlineData: {
            mimeType: generatedImage.mimeType,
            data: generatedImage.base64,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Gemini response');
      }

      const feedback: DesignFeedbackResult = JSON.parse(jsonMatch[0]);
      return feedback;
    } catch (error: any) {
      console.error('Gemini feedback error:', error);
      throw new Error(`Design feedback failed: ${error.message}`);
    }
  }

  /**
   * Enhance user prompt with AI understanding
   */
  async enhancePrompt(userPrompt: string, roomType: string): Promise<string> {
    try {
      const prompt = `You are an expert interior designer. The user wants to redesign a ${roomType} with this description:
      "${userPrompt}"

      Generate a detailed, professional prompt for an AI image generator that will create a beautiful interior design.
      Focus on:
      - Specific design elements
      - Color schemes
      - Materials and textures
      - Lighting
      - Furniture arrangements

      Return ONLY the enhanced prompt text, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      console.error('Gemini prompt enhancement error:', error);
      // Fallback to original prompt
      return userPrompt;
    }
  }

  /**
   * Generate style keywords for a given style preset
   */
  async generateStyleKeywords(styleName: string, description: string): Promise<string[]> {
    try {
      const prompt = `Generate 10-15 detailed keywords for the interior design style: "${styleName}"
      Description: ${description}

      Return as a JSON array of strings: ["keyword1", "keyword2", ...]
      Keywords should be specific design elements, colors, materials, patterns, etc.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Gemini response');
      }

      const keywords: string[] = JSON.parse(jsonMatch[0]);
      return keywords;
    } catch (error: any) {
      console.error('Gemini keyword generation error:', error);
      return [];
    }
  }

  /**
   * Helper: Download image and convert to base64
   */
  private async getImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
    try {
      // If it's a local file path
      if (imageUrl.startsWith('/') || imageUrl.startsWith('file://')) {
        const filePath = imageUrl.replace('file://', '');
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

        return {
          base64: buffer.toString('base64'),
          mimeType,
        };
      }

      // If it's a URL, fetch it
      const axios = require('axios');
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const mimeType = response.headers['content-type'] || 'image/jpeg';

      return {
        base64: buffer.toString('base64'),
        mimeType,
      };
    } catch (error: any) {
      console.error('Error fetching image:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyze(imageUrls: string[]): Promise<ImageAnalysisResult[]> {
    const results = await Promise.all(
      imageUrls.map((url) => this.analyzeImage(url))
    );
    return results;
  }
}

export default new GeminiService();
