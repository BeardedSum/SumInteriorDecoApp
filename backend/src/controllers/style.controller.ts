import { Request, Response } from 'express';
import { AppError } from '../middleware/error.middleware';
import StylePresetRepository from '../repositories/style-preset.repository';

export class StyleController {
  /**
   * Get all style presets
   */
  async getAllStyles(req: Request, res: Response) {
    try {
      const { category, is_premium, is_active = true, sort = 'popularity', order = 'DESC' } = req.query;

      const queryBuilder = StylePresetRepository.createQueryBuilder('style')
        .where('style.is_active = :is_active', { is_active: is_active === 'true' });

      // Apply filters
      if (category) {
        queryBuilder.andWhere('LOWER(style.category) = LOWER(:category)', { category });
      }

      if (is_premium !== undefined) {
        queryBuilder.andWhere('style.is_premium = :is_premium', { is_premium: is_premium === 'true' });
      }

      // Sort
      if (sort === 'popularity') {
        queryBuilder.orderBy('style.popularity', order as 'ASC' | 'DESC');
      } else if (sort === 'usage') {
        queryBuilder.orderBy('style.usage_count', order as 'ASC' | 'DESC');
      } else if (sort === 'name') {
        queryBuilder.orderBy('style.name', order as 'ASC' | 'DESC');
      } else {
        queryBuilder.orderBy('style.created_at', order as 'ASC' | 'DESC');
      }

      const styles = await queryBuilder.getMany();

      res.json({
        success: true,
        data: { styles },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get style presets by category
   */
  async getStylesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;

      const styles = await StylePresetRepository.find({
        where: {
          category: category.toLowerCase() as any,
          is_active: true,
        },
        order: {
          popularity: 'DESC',
        },
      });

      res.json({
        success: true,
        data: { styles },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get a single style preset by ID or slug
   */
  async getStyleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Try to find by ID first, then by slug
      let style = await StylePresetRepository.findOne({ where: { id } });

      if (!style) {
        style = await StylePresetRepository.findOne({ where: { slug: id } });
      }

      if (!style) {
        throw new AppError('Style preset not found', 404);
      }

      res.json({
        success: true,
        data: { style },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Get available categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const result = await StylePresetRepository
        .createQueryBuilder('style')
        .select('DISTINCT style.category', 'category')
        .where('style.is_active = :is_active', { is_active: true })
        .getRawMany();

      const categories = result.map((r) => r.category);

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get popular/trending styles
   */
  async getPopularStyles(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const styles = await StylePresetRepository.find({
        where: { is_active: true },
        order: { popularity: 'DESC' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: { styles },
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Increment style usage count (when a style is selected for generation)
   */
  async incrementUsageCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const style = await StylePresetRepository.findOne({ where: { id } });

      if (!style) {
        throw new AppError('Style preset not found', 404);
      }

      style.usage_count += 1;
      await StylePresetRepository.save(style);

      res.json({
        success: true,
        data: { usage_count: style.usage_count },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }
}

export default new StyleController();
