import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Project, ProjectStatus } from '../entities/Project.entity';

export class ProjectRepository extends Repository<Project> {
  constructor() {
    super(Project, AppDataSource.manager);
  }

  async findByUserId(userId: string, limit?: number): Promise<Project[]> {
    const query = this.createQueryBuilder('project')
      .where('project.user_id = :userId', { userId })
      .orderBy('project.created_at', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }

  async findByStatus(userId: string, status: ProjectStatus): Promise<Project[]> {
    return this.find({
      where: { user_id: userId, status },
      order: { created_at: 'DESC' },
    });
  }

  async findFavorites(userId: string): Promise<Project[]> {
    return this.find({
      where: { user_id: userId, is_favorite: true },
      order: { created_at: 'DESC' },
    });
  }

  async incrementViewCount(projectId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(Project)
      .set({ view_count: () => 'view_count + 1' })
      .where('id = :projectId', { projectId })
      .execute();
  }

  async incrementShareCount(projectId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(Project)
      .set({ share_count: () => 'share_count + 1' })
      .where('id = :projectId', { projectId })
      .execute();
  }

  async toggleFavorite(projectId: string): Promise<void> {
    const project = await this.findOne({ where: { id: projectId } });
    if (project) {
      await this.update(projectId, { is_favorite: !project.is_favorite });
    }
  }

  async getProjectWithJobs(projectId: string): Promise<Project | null> {
    return this.findOne({
      where: { id: projectId },
      relations: ['generation_jobs'],
    });
  }
}

export default new ProjectRepository();
