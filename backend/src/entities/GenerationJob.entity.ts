import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Project } from './Project.entity';

export enum GenerationMode {
  VISION_3D = '3d_vision',
  REDESIGN_2D = '2d_redesign',
  VIRTUAL_STAGING = 'virtual_staging',
  FREESTYLE = 'freestyle',
  OBJECT_REMOVAL = 'object_removal',
  COLOR_MATERIAL = 'color_material',
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('generation_jobs')
@Index(['user_id'])
@Index(['project_id'])
@Index(['status'])
@Index(['created_at'])
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  project_id: string | null;

  @Column({
    type: 'enum',
    enum: GenerationMode,
  })
  generation_mode: GenerationMode;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.QUEUED,
  })
  @Index()
  status: JobStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  input_image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  output_image_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  style_preset_id: string | null;

  @Column({ type: 'text', nullable: true })
  prompt: string | null;

  @Column({ type: 'text', nullable: true })
  negative_prompt: string | null;

  @Column({ type: 'float', default: 0.5 })
  creative_freedom: number;

  @Column({ type: 'int', default: 1 })
  credits_cost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_job_id: string | null; // Replicate prediction ID

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', nullable: true })
  processing_time_ms: number | null;

  @Column({ type: 'jsonb', nullable: true })
  generation_params: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  ai_analysis: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, (project) => project.generation_jobs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;
}
