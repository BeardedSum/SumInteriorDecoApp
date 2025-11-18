import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Heart, Trash2, Share2, Download } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { Card, Button, Modal, Loading } from '../components/ui';
import { BeforeAfterSlider } from '../components/features/BeforeAfterSlider';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, deleteProject, toggleFavorite, isLoading } = useProjectStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'favorites'>('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (filter === 'favorites') return project.is_favorite;
    if (filter === 'completed') return project.status === 'completed';
    return true;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        toast.success('Project deleted');
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-montserrat font-bold">My Projects</h1>
          <p className="text-gray-600">{projects.length} total projects</p>
        </div>
        <Button onClick={() => navigate('/create')}>
          Create New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All Projects' },
          { id: 'completed', label: 'Completed' },
          { id: 'favorites', label: 'Favorites' },
        ].map((f) => (
          <button
            key={f.id}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f.id
                ? 'bg-primary-navy text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFilter(f.id as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                hover
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedProject(project);
                  setShowModal(true);
                }}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {project.generated_image_url ? (
                    <img
                      src={project.generated_image_url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🎨
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                      onClick={(e) => handleFavorite(project.id, e)}
                    >
                      <Heart
                        className={`w-4 h-4 ${project.is_favorite ? 'text-error fill-current' : 'text-gray-600'}`}
                      />
                    </button>
                    <button
                      className="p-2 bg-white rounded-full hover:scale-110 transition-transform"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{project.status}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'favorites'
              ? 'You haven\'t favorited any projects yet'
              : 'Start creating your first AI design!'}
          </p>
          {filter !== 'all' && (
            <Button variant="ghost" onClick={() => setFilter('all')}>
              View All Projects
            </Button>
          )}
        </Card>
      )}

      {/* Project Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedProject?.name}
        size="xl"
      >
        {selectedProject && (
          <div>
            {selectedProject.original_image_url && selectedProject.generated_image_url ? (
              <BeforeAfterSlider
                beforeImage={selectedProject.original_image_url}
                afterImage={selectedProject.generated_image_url}
                onFavorite={() => toggleFavorite(selectedProject.id)}
                isFavorite={selectedProject.is_favorite}
              />
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-gray-600">No images available</p>
                </div>
              </div>
            )}

            {selectedProject.description && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{selectedProject.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;
