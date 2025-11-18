import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { GenerationJob, JobStatus } from '../entities/GenerationJob.entity';

export class GenerationJobRepository extends Repository<GenerationJob> {
  constructor() {
    super(GenerationJob, AppDataSource.manager);
  }

  async findByUserId(userId: string, limit?: number): Promise<GenerationJob[]> {
    const query = this.createQueryBuilder('job')
      .where('job.user_id = :userId', { userId })
      .orderBy('job.created_at', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }

  async findByStatus(status: JobStatus): Promise<GenerationJob[]> {
    return this.find({
      where: { status },
      order: { created_at: 'ASC' },
    });
  }

  async findPendingJobs(): Promise<GenerationJob[]> {
    return this.find({
      where: { status: JobStatus.QUEUED },
      order: { created_at: 'ASC' },
    });
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    additionalData?: Partial<GenerationJob>
  ): Promise<void> {
    await this.update(jobId, {
      status,
      ...additionalData,
      updated_at: new Date(),
    });
  }

  async markAsProcessing(jobId: string): Promise<void> {
    await this.update(jobId, {
      status: JobStatus.PROCESSING,
      started_at: new Date(),
    });
  }

  async markAsCompleted(jobId: string, outputUrl: string, processingTimeMs: number): Promise<void> {
    await this.update(jobId, {
      status: JobStatus.COMPLETED,
      output_image_url: outputUrl,
      completed_at: new Date(),
      processing_time_ms: processingTimeMs,
    });
  }

  async markAsFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.update(jobId, {
      status: JobStatus.FAILED,
      error_message: errorMessage,
      completed_at: new Date(),
    });
  }

  async getUserJobStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
  }> {
    const jobs = await this.find({ where: { user_id: userId } });

    return {
      total: jobs.length,
      completed: jobs.filter((j) => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter((j) => j.status === JobStatus.FAILED).length,
      processing: jobs.filter((j) => j.status === JobStatus.PROCESSING).length,
    };
  }
}

export default new GenerationJobRepository();
