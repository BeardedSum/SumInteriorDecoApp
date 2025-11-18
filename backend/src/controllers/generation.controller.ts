import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import GenerationJobRepository from '../repositories/generation-job.repository';
import ProjectRepository from '../repositories/project.repository';
import UserRepository from '../repositories/user.repository';
import StylePresetRepository from '../repositories/style-preset.repository';
import ReplicateService from '../services/replicate.service';
import GeminiService from '../services/gemini.service';
import ClaudeService from '../services/claude.service';
import CloudinaryService from '../services/cloudinary.service';

export class GenerationController {
  /**
   * Start a new AI generation job
   */
  async generateDesign(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        project_id,
        generation_mode,
        input_image_url,
        style_preset_id,
        prompt,
        negative_prompt,
        creative_freedom = 0.5,
        enhance_prompt = false,
      } = req.body;

      // Validate generation mode
      const validModes = ['3d_vision', '2d_redesign', 'virtual_staging', 'freestyle', 'object_removal', 'color_material'];
      if (!validModes.includes(generation_mode)) {
        throw new AppError(`Invalid generation mode. Must be one of: ${validModes.join(', ')}`, 400);
      }

      // Validate input image for modes that require it
      if (['3d_vision', '2d_redesign', 'virtual_staging', 'object_removal', 'color_material'].includes(generation_mode)) {
        if (!input_image_url) {
          throw new AppError('Input image is required for this generation mode', 400);
        }
      }

      // Check user credits
      const user = await UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const creditsCost = generation_mode === 'virtual_staging' ? 2 : 1;
      if (user.credits_balance < creditsCost) {
        throw new AppError('Insufficient credits. Please purchase more credits to continue.', 402);
      }

      // Get style preset if provided
      let stylePreset = null;
      if (style_preset_id) {
        stylePreset = await StylePresetRepository.findOne({ where: { id: style_preset_id } });
        if (!stylePreset) {
          throw new AppError('Style preset not found', 404);
        }
      }

      // Enhance prompt with Claude if requested
      let finalPrompt = prompt || '';
      if (enhance_prompt && prompt) {
        const project = await ProjectRepository.findOne({ where: { id: project_id } });
        const roomType = project?.room_type || 'living_room';

        try {
          const optimization = await ClaudeService.optimizePrompt(
            prompt,
            stylePreset?.name || 'Modern',
            roomType
          );
          finalPrompt = optimization.optimizedPrompt;
        } catch (error) {
          console.error('Prompt enhancement failed, using original:', error);
        }
      }

      // Create generation job record
      const generationJob = GenerationJobRepository.create({
        user_id: userId,
        project_id: project_id || null,
        generation_mode,
        status: 'queued',
        input_image_url,
        style_preset_id,
        prompt: finalPrompt,
        negative_prompt,
        creative_freedom,
        credits_cost: creditsCost,
      });

      await GenerationJobRepository.save(generationJob);

      // Deduct credits immediately
      user.credits_balance -= creditsCost;
      await UserRepository.save(user);

      // Start generation in background
      this.processGeneration(generationJob.id).catch((error) => {
        console.error('Background generation failed:', error);
      });

      res.status(202).json({
        success: true,
        message: 'Generation started',
        data: {
          job_id: generationJob.id,
          status: 'queued',
          credits_remaining: user.credits_balance,
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 400);
    }
  }

  /**
   * Get generation job status
   */
  async getJobStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const job = await GenerationJobRepository.findOne({
        where: { id, user_id: userId },
        relations: ['project', 'style_preset'],
      });

      if (!job) {
        throw new AppError('Generation job not found', 404);
      }

      res.json({
        success: true,
        data: { job },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Get all generation jobs for user
   */
  async getUserJobs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { status, limit = 20, offset = 0 } = req.query;

      const queryBuilder = GenerationJobRepository.createQueryBuilder('job')
        .where('job.user_id = :userId', { userId })
        .leftJoinAndSelect('job.project', 'project')
        .leftJoinAndSelect('job.style_preset', 'style_preset')
        .orderBy('job.created_at', 'DESC')
        .take(Number(limit))
        .skip(Number(offset));

      if (status) {
        queryBuilder.andWhere('job.status = :status', { status });
      }

      const [jobs, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
          },
        },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Analyze image with Gemini AI
   */
  async analyzeImage(req: AuthRequest, res: Response) {
    try {
      const { image_url } = req.body;

      if (!image_url) {
        throw new AppError('Image URL is required', 400);
      }

      const analysis = await GeminiService.analyzeImage(image_url);

      res.json({
        success: true,
        data: { analysis },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get design consultation from Claude
   */
  async getConsultation(req: AuthRequest, res: Response) {
    try {
      const { requirements, room_type, budget, preferences } = req.body;

      if (!requirements) {
        throw new AppError('Requirements are required', 400);
      }

      if (!room_type) {
        throw new AppError('Room type is required', 400);
      }

      const consultation = await ClaudeService.provideDesignConsultation(
        requirements,
        room_type,
        budget,
        preferences
      );

      res.json({
        success: true,
        data: { consultation },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Background processing of generation job
   */
  private async processGeneration(jobId: string) {
    try {
      const job = await GenerationJobRepository.findOne({
        where: { id: jobId },
        relations: ['style_preset', 'project'],
      });

      if (!job) {
        console.error('Job not found:', jobId);
        return;
      }

      // Update status to processing
      job.status = 'processing';
      await GenerationJobRepository.save(job);

      const startTime = Date.now();

      let result;
      switch (job.generation_mode) {
        case '3d_vision':
          result = await ReplicateService.generate3DVision(
            job.input_image_url!,
            job.style_preset?.keywords || '',
            job.prompt || '',
            job.creative_freedom
          );
          break;

        case '2d_redesign':
          result = await ReplicateService.generate2DRedesign(
            job.input_image_url!,
            job.style_preset?.keywords || '',
            job.prompt || '',
            job.creative_freedom
          );
          break;

        case 'virtual_staging':
          result = await ReplicateService.generateVirtualStaging(
            job.input_image_url!,
            job.style_preset?.keywords || '',
            job.prompt || ''
          );
          break;

        case 'freestyle':
          result = await ReplicateService.generateFreestyle(
            job.prompt || '',
            job.style_preset?.keywords || ''
          );
          break;

        case 'object_removal':
          result = await ReplicateService.generateObjectRemoval(
            job.input_image_url!,
            job.prompt || ''
          );
          break;

        case 'color_material':
          result = await ReplicateService.generateColorMaterial(
            job.input_image_url!,
            job.prompt || '',
            job.creative_freedom
          );
          break;

        default:
          throw new Error('Invalid generation mode');
      }

      const processingTime = Date.now() - startTime;

      // Upload result to Cloudinary
      let outputUrl = result.output;
      if (result.output && !result.output.startsWith('http')) {
        // If it's a base64 or local file, upload to Cloudinary
        const uploadResult = await CloudinaryService.uploadImage(result.output, {
          folder: 'generations',
          tags: [job.generation_mode, job.style_preset?.slug || 'custom'],
        });
        outputUrl = uploadResult.secure_url;
      }

      // Try to get AI analysis of the result
      let aiAnalysis = null;
      if (job.input_image_url && outputUrl) {
        try {
          const feedback = await GeminiService.getDesignFeedback(
            job.input_image_url,
            outputUrl,
            job.style_preset?.name || 'Modern'
          );
          aiAnalysis = feedback;
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }

      // Update job as completed
      job.status = 'completed';
      job.output_image_url = outputUrl;
      job.external_job_id = result.id;
      job.processing_time_ms = processingTime;
      job.ai_analysis = aiAnalysis as any;
      job.generation_params = {
        model: result.model,
        version: result.version,
      } as any;

      await GenerationJobRepository.save(job);

      // Update project if exists
      if (job.project_id) {
        const project = await ProjectRepository.findOne({ where: { id: job.project_id } });
        if (project) {
          project.generated_image_url = outputUrl;
          project.status = 'completed';
          await ProjectRepository.save(project);
        }
      }

      console.log(`Generation job ${jobId} completed successfully in ${processingTime}ms`);
    } catch (error: any) {
      console.error('Generation processing error:', error);

      // Update job as failed
      const job = await GenerationJobRepository.findOne({ where: { id: jobId } });
      if (job) {
        job.status = 'failed';
        job.error_message = error.message;
        await GenerationJobRepository.save(job);

        // Refund credits
        const user = await UserRepository.findOne({ where: { id: job.user_id } });
        if (user) {
          user.credits_balance += job.credits_cost;
          await UserRepository.save(user);
        }
      }
    }
  }
}

export default new GenerationController();
