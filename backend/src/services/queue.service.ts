import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import GenerationJobRepository from '../repositories/generation-job.repository';
import ProjectRepository from '../repositories/project.repository';
import UserRepository from '../repositories/user.repository';
import ReplicateService from './replicate.service';
import GeminiService from './gemini.service';
import CloudinaryService from './cloudinary.service';

/**
 * BullMQ Queue Service for async job processing
 */

// Redis connection for BullMQ
const redisConnection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Job types
interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId?: string;
  generationMode: string;
  inputImageUrl?: string;
  stylePresetId?: string;
  prompt?: string;
  negativeprompt?: string;
  creativeFreedom: number;
}

// Create generation queue
export const generationQueue = new Queue<GenerationJobData>('generation-jobs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Create worker to process jobs
const generationWorker = new Worker<GenerationJobData>(
  'generation-jobs',
  async (job: Job<GenerationJobData>) => {
    console.log(`Processing generation job ${job.id}:`, job.data);

    try {
      const { jobId, userId } = job.data;

      // Get job from database
      const generationJob = await GenerationJobRepository.findOne({
        where: { id: jobId },
        relations: ['style_preset', 'project'],
      });

      if (!generationJob) {
        throw new Error(`Generation job ${jobId} not found`);
      }

      // Update status to processing
      generationJob.status = 'processing';
      await GenerationJobRepository.save(generationJob);

      // Update progress
      await job.updateProgress(10);

      const startTime = Date.now();

      // Perform generation based on mode
      let result;
      switch (generationJob.generation_mode) {
        case '3d_vision':
          await job.updateProgress(20);
          result = await ReplicateService.generate3DVision(
            generationJob.input_image_url!,
            generationJob.style_preset?.keywords || '',
            generationJob.prompt || '',
            generationJob.creative_freedom
          );
          break;

        case '2d_redesign':
          await job.updateProgress(20);
          result = await ReplicateService.generate2DRedesign(
            generationJob.input_image_url!,
            generationJob.style_preset?.keywords || '',
            generationJob.prompt || '',
            generationJob.creative_freedom
          );
          break;

        case 'virtual_staging':
          await job.updateProgress(20);
          result = await ReplicateService.generateVirtualStaging(
            generationJob.input_image_url!,
            generationJob.style_preset?.keywords || '',
            generationJob.prompt || ''
          );
          break;

        case 'freestyle':
          await job.updateProgress(20);
          result = await ReplicateService.generateFreestyle(
            generationJob.prompt || '',
            generationJob.style_preset?.keywords || ''
          );
          break;

        case 'object_removal':
          await job.updateProgress(20);
          result = await ReplicateService.generateObjectRemoval(
            generationJob.input_image_url!,
            generationJob.prompt || ''
          );
          break;

        case 'color_material':
          await job.updateProgress(20);
          result = await ReplicateService.generateColorMaterial(
            generationJob.input_image_url!,
            generationJob.prompt || '',
            generationJob.creative_freedom
          );
          break;

        default:
          throw new Error(`Invalid generation mode: ${generationJob.generation_mode}`);
      }

      await job.updateProgress(60);

      // Upload result to Cloudinary
      let outputUrl = result.output;
      if (result.output && !result.output.startsWith('http')) {
        const uploadResult = await CloudinaryService.uploadImage(result.output, {
          folder: 'generations',
          tags: [generationJob.generation_mode, generationJob.style_preset?.slug || 'custom'],
        });
        outputUrl = uploadResult.secure_url;
      }

      await job.updateProgress(80);

      // Get AI analysis if we have both input and output
      let aiAnalysis = null;
      if (generationJob.input_image_url && outputUrl) {
        try {
          const feedback = await GeminiService.getDesignFeedback(
            generationJob.input_image_url,
            outputUrl,
            generationJob.style_preset?.name || 'Modern'
          );
          aiAnalysis = feedback;
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      }

      await job.updateProgress(90);

      const processingTime = Date.now() - startTime;

      // Update job as completed
      generationJob.status = 'completed';
      generationJob.output_image_url = outputUrl;
      generationJob.external_job_id = result.id;
      generationJob.processing_time_ms = processingTime;
      generationJob.ai_analysis = aiAnalysis as any;
      generationJob.generation_params = {
        model: result.model,
        version: result.version,
      } as any;

      await GenerationJobRepository.save(generationJob);

      // Update project if exists
      if (generationJob.project_id) {
        const project = await ProjectRepository.findOne({ where: { id: generationJob.project_id } });
        if (project) {
          project.generated_image_url = outputUrl;
          project.status = 'completed';
          await ProjectRepository.save(project);
        }
      }

      await job.updateProgress(100);

      console.log(`Generation job ${jobId} completed successfully in ${processingTime}ms`);

      return {
        success: true,
        outputUrl,
        processingTime,
      };
    } catch (error: any) {
      console.error('Generation job processing error:', error);

      // Update job as failed
      const { jobId, userId } = job.data;
      const generationJob = await GenerationJobRepository.findOne({ where: { id: jobId } });

      if (generationJob) {
        generationJob.status = 'failed';
        generationJob.error_message = error.message;
        await GenerationJobRepository.save(generationJob);

        // Refund credits
        const user = await UserRepository.findOne({ where: { id: userId } });
        if (user) {
          user.credits_balance += generationJob.credits_cost;
          await UserRepository.save(user);
          console.log(`Refunded ${generationJob.credits_cost} credits to user ${userId}`);
        }
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 jobs concurrently
  }
);

// Worker event handlers
generationWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

generationWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error);
});

generationWorker.on('active', (job) => {
  console.log(`⚙️ Job ${job.id} started processing`);
});

// Queue event handlers
generationQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

/**
 * Add a generation job to the queue
 */
export async function addGenerationJob(data: GenerationJobData) {
  const job = await generationQueue.add('generate-design', data, {
    jobId: data.jobId,
    priority: data.generationMode === 'virtual_staging' ? 5 : 10, // Higher priority for staging
  });

  return job;
}

/**
 * Get job status from queue
 */
export async function getJobProgress(jobId: string) {
  const job = await generationQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  };
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string) {
  const job = await generationQueue.getJob(jobId);

  if (job) {
    await job.remove();

    // Update database
    const generationJob = await GenerationJobRepository.findOne({ where: { id: jobId } });
    if (generationJob && generationJob.status !== 'completed') {
      generationJob.status = 'cancelled';
      await GenerationJobRepository.save(generationJob);

      // Refund credits
      const user = await UserRepository.findOne({ where: { id: generationJob.user_id } });
      if (user) {
        user.credits_balance += generationJob.credits_cost;
        await UserRepository.save(user);
      }
    }

    return true;
  }

  return false;
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    generationQueue.getWaitingCount(),
    generationQueue.getActiveCount(),
    generationQueue.getCompletedCount(),
    generationQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await generationWorker.close();
  await generationQueue.close();
  await redisConnection.quit();
  process.exit(0);
});

export default {
  addGenerationJob,
  getJobProgress,
  cancelJob,
  getQueueStats,
  generationQueue,
  generationWorker,
};
