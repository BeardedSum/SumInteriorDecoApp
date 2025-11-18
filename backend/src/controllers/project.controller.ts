import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import ProjectRepository from '../repositories/project.repository';
import UserRepository from '../repositories/user.repository';

export class ProjectController {
  /**
   * Get all projects for the authenticated user
   */
  async getUserProjects(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { status, room_type, is_favorite, sort = 'created_at', order = 'DESC', limit = 20, offset = 0 } = req.query;

      const queryBuilder = ProjectRepository.createQueryBuilder('project')
        .where('project.user_id = :userId', { userId })
        .orderBy(`project.${sort}`, order as 'ASC' | 'DESC')
        .take(Number(limit))
        .skip(Number(offset));

      // Apply filters
      if (status) {
        queryBuilder.andWhere('project.status = :status', { status });
      }
      if (room_type) {
        queryBuilder.andWhere('project.room_type = :room_type', { room_type });
      }
      if (is_favorite !== undefined) {
        queryBuilder.andWhere('project.is_favorite = :is_favorite', { is_favorite: is_favorite === 'true' });
      }

      const [projects, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          projects,
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
   * Get a single project by ID
   */
  async getProjectById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
        relations: ['generation_jobs'],
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      res.json({
        success: true,
        data: { project },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, description, room_type, original_image_url, style_preset_id, settings } = req.body;

      if (!name) {
        throw new AppError('Project name is required', 400);
      }

      if (!room_type) {
        throw new AppError('Room type is required', 400);
      }

      // Validate room type
      const validRoomTypes = [
        'living_room',
        'bedroom',
        'kitchen',
        'bathroom',
        'dining_room',
        'office',
        'outdoor',
        'other',
      ];

      if (!validRoomTypes.includes(room_type)) {
        throw new AppError(`Invalid room type. Must be one of: ${validRoomTypes.join(', ')}`, 400);
      }

      const project = ProjectRepository.create({
        user_id: userId,
        name,
        description,
        room_type,
        original_image_url,
        style_preset_id,
        settings: settings || {},
        status: 'draft',
      });

      await ProjectRepository.save(project);

      res.status(201).json({
        success: true,
        data: { project },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 400);
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updates = req.body;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Update allowed fields
      const allowedFields = [
        'name',
        'description',
        'room_type',
        'original_image_url',
        'generated_image_url',
        'style_preset_id',
        'settings',
        'is_favorite',
        'status',
      ];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          (project as any)[field] = updates[field];
        }
      });

      await ProjectRepository.save(project);

      res.json({
        success: true,
        data: { project },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      await ProjectRepository.remove(project);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Toggle project favorite status
   */
  async toggleFavorite(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      project.is_favorite = !project.is_favorite;
      await ProjectRepository.save(project);

      res.json({
        success: true,
        data: { project },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Increment project view count
   */
  async incrementViewCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      project.view_count += 1;
      await ProjectRepository.save(project);

      res.json({
        success: true,
        data: { view_count: project.view_count },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }

  /**
   * Increment project share count
   */
  async incrementShareCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const project = await ProjectRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      project.share_count += 1;
      await ProjectRepository.save(project);

      res.json({
        success: true,
        data: { share_count: project.share_count },
      });
    } catch (error: any) {
      throw new AppError(error.message, error.statusCode || 500);
    }
  }
}

export default new ProjectController();
