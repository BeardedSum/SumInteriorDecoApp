import Replicate from 'replicate';
import config from '../config';
import { GenerationMode } from '../entities/GenerationJob.entity';

interface GenerationParams {
  mode: GenerationMode;
  inputImageUrl: string;
  styleKeywords: string;
  prompt?: string;
  negativePrompt?: string;
  creativeFreedom?: number;
}

interface ReplicateResponse {
  predictionId: string;
  status: string;
  output?: string[] | string;
  error?: string;
}

export class ReplicateService {
  private replicate: Replicate;

  constructor() {
    if (!config.ai.replicate.apiKey) {
      throw new Error('Replicate API key is not configured');
    }
    this.replicate = new Replicate({
      auth: config.ai.replicate.apiKey,
    });
  }

  /**
   * Generate interior design image using SDXL with ControlNet
   */
  async generateInteriorDesign(params: GenerationParams): Promise<ReplicateResponse> {
    const { inputImageUrl, styleKeywords, prompt, negativePrompt, creativeFreedom = 0.5 } = params;

    // Construct the full prompt
    const fullPrompt = prompt
      ? `${styleKeywords}, ${prompt}`
      : `${styleKeywords}, professional interior design, high quality, detailed, realistic, well-lit`;

    const defaultNegativePrompt =
      'blurry, distorted, low quality, artifacts, oversaturated, unrealistic, poor lighting, bad composition';
    const finalNegativePrompt = negativePrompt
      ? `${defaultNegativePrompt}, ${negativePrompt}`
      : defaultNegativePrompt;

    try {
      const prediction = await this.replicate.predictions.create({
        version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL ControlNet
        input: {
          image: inputImageUrl,
          prompt: fullPrompt,
          negative_prompt: finalNegativePrompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          controlnet_conditioning_scale: creativeFreedom,
        },
      });

      return {
        predictionId: prediction.id,
        status: prediction.status,
        output: prediction.output as string[] | string,
        error: prediction.error?.toString(),
      };
    } catch (error: any) {
      console.error('Replicate generation error:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Virtual staging - fill empty rooms with furniture
   */
  async virtualStaging(inputImageUrl: string, styleKeywords: string): Promise<ReplicateResponse> {
    const prompt = `${styleKeywords}, fully furnished room, interior design, furniture, decorations, complete room staging, professional photography`;
    const negativePrompt = 'empty room, blank walls, no furniture, incomplete';

    try {
      const prediction = await this.replicate.predictions.create({
        version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          image: inputImageUrl,
          prompt,
          negative_prompt: negativePrompt,
          num_outputs: 1,
          guidance_scale: 8,
          num_inference_steps: 60,
          controlnet_conditioning_scale: 0.8,
        },
      });

      return {
        predictionId: prediction.id,
        status: prediction.status,
        output: prediction.output as string[] | string,
        error: prediction.error?.toString(),
      };
    } catch (error: any) {
      console.error('Replicate virtual staging error:', error);
      throw new Error(`Failed to stage image: ${error.message}`);
    }
  }

  /**
   * Object removal using inpainting
   */
  async removeObject(inputImageUrl: string, maskImageUrl: string): Promise<ReplicateResponse> {
    try {
      const prediction = await this.replicate.predictions.create({
        version: 'c75ecf2a1022c7448c06b419ca32b8fe1f6152c1d3ff822c50fa2c71e18c8f81', // Stable Diffusion Inpainting
        input: {
          image: inputImageUrl,
          mask: maskImageUrl,
          prompt: 'clean empty space, natural continuation, seamless fill',
          negative_prompt: 'objects, furniture, artifacts',
          num_outputs: 1,
        },
      });

      return {
        predictionId: prediction.id,
        status: prediction.status,
        output: prediction.output as string[] | string,
        error: prediction.error?.toString(),
      };
    } catch (error: any) {
      console.error('Replicate object removal error:', error);
      throw new Error(`Failed to remove object: ${error.message}`);
    }
  }

  /**
   * Freestyle generation (no input image)
   */
  async freestyleGeneration(styleKeywords: string, prompt: string): Promise<ReplicateResponse> {
    const fullPrompt = `${styleKeywords}, ${prompt}, interior design, professional photography, high quality, detailed`;

    try {
      const prediction = await this.replicate.predictions.create({
        version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          prompt: fullPrompt,
          negative_prompt: 'blurry, distorted, low quality, unrealistic',
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      });

      return {
        predictionId: prediction.id,
        status: prediction.status,
        output: prediction.output as string[] | string,
        error: prediction.error?.toString(),
      };
    } catch (error: any) {
      console.error('Replicate freestyle generation error:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Check prediction status
   */
  async checkPredictionStatus(predictionId: string): Promise<ReplicateResponse> {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);

      return {
        predictionId: prediction.id,
        status: prediction.status,
        output: prediction.output as string[] | string,
        error: prediction.error?.toString(),
      };
    } catch (error: any) {
      console.error('Replicate status check error:', error);
      throw new Error(`Failed to check prediction status: ${error.message}`);
    }
  }

  /**
   * Wait for prediction to complete
   */
  async waitForPrediction(predictionId: string, maxWaitMs: number = 60000): Promise<ReplicateResponse> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.checkPredictionStatus(predictionId);

      if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
        return result;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Prediction timed out');
  }
}

export default new ReplicateService();
