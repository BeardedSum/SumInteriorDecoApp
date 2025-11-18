import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StyleCategory {
  AFRICAN = 'african',
  LUXURY = 'luxury',
  MODERN = 'modern',
  TRADITIONAL = 'traditional',
  ECLECTIC = 'eclectic',
  RETRO = 'retro',
}

@Entity('style_presets')
@Index(['category'])
@Index(['is_premium'])
@Index(['is_active'])
@Index(['popularity'])
export class StylePreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: StyleCategory,
  })
  @Index()
  category: StyleCategory;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text' })
  keywords: string; // Used for AI prompts

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'boolean', default: false })
  @Index()
  is_premium: boolean;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  popularity: number; // Used for sorting/recommendations

  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @Column({ type: 'jsonb', nullable: true })
  advanced_params: Record<string, any> | null; // AI model specific parameters

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
