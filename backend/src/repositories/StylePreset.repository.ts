import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { StylePreset, StyleCategory } from '../entities/StylePreset.entity';

export class StylePresetRepository extends Repository<StylePreset> {
  constructor() {
    super(StylePreset, AppDataSource.manager);
  }

  async findAllActive(): Promise<StylePreset[]> {
    return this.find({
      where: { is_active: true },
      order: { popularity: 'DESC' },
    });
  }

  async findByCategory(category: StyleCategory): Promise<StylePreset[]> {
    return this.find({
      where: { category, is_active: true },
      order: { popularity: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<StylePreset | null> {
    return this.findOne({ where: { slug } });
  }

  async findPremiumStyles(): Promise<StylePreset[]> {
    return this.find({
      where: { is_premium: true, is_active: true },
      order: { popularity: 'DESC' },
    });
  }

  async findFreeStyles(): Promise<StylePreset[]> {
    return this.find({
      where: { is_premium: false, is_active: true },
      order: { popularity: 'DESC' },
    });
  }

  async incrementUsageCount(styleId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(StylePreset)
      .set({ usage_count: () => 'usage_count + 1' })
      .where('id = :styleId', { styleId })
      .execute();
  }

  async getMostPopular(limit: number = 5): Promise<StylePreset[]> {
    return this.find({
      where: { is_active: true },
      order: { popularity: 'DESC' },
      take: limit,
    });
  }
}

export default new StylePresetRepository();
