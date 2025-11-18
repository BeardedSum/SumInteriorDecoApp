import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { GenerationJob } from './GenerationJob.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RoomType {
  LIVING_ROOM = 'living_room',
  BEDROOM = 'bedroom',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  DINING_ROOM = 'dining_room',
  OFFICE = 'office',
  OUTDOOR = 'outdoor',
  OTHER = 'other',
}

@Entity('projects')
@Index(['user_id'])
@Index(['status'])
@Index(['created_at'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: RoomType,
    nullable: true,
  })
  room_type: RoomType | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  original_image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  generated_image_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  style_preset_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  is_favorite: boolean;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  share_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => GenerationJob, (job) => job.project)
  generation_jobs: GenerationJob[];
}
