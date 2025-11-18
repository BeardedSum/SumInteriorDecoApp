import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Paintbrush, Home as HomeIcon, Eraser, Palette, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { Card, CardHeader, CardTitle, CardDescription, Button } from '../components/ui';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const recentProjects = projects.slice(0, 4);

  const quickActions = [
    {
      icon: Paintbrush,
      label: 'Redesign Room',
      description: '2D/3D style transformation',
      color: 'from-blue-500 to-blue-600',
      action: () => navigate('/create?mode=redesign'),
    },
    {
      icon: HomeIcon,
      label: 'Virtual Staging',
      description: 'Fill empty spaces',
      color: 'from-green-500 to-green-600',
      action: () => navigate('/create?mode=staging'),
    },
    {
      icon: Eraser,
      label: 'Remove Objects',
      description: 'Clean up your space',
      color: 'from-purple-500 to-purple-600',
      action: () => navigate('/create?mode=removal'),
    },
    {
      icon: Palette,
      label: 'Color Editor',
      description: 'Change materials',
      color: 'from-pink-500 to-pink-600',
      action: () => navigate('/create?mode=color'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card variant="premium" className="relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-montserrat font-bold mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-white/90 mb-4">
            You have {user?.credits_balance || 0} credits available
          </p>
          <Button variant="secondary" onClick={() => navigate('/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Start New Design
          </Button>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  hover
                  className="cursor-pointer group"
                  onClick={action.action}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Projects</h2>
          {projects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              View All →
            </Button>
          )}
        </div>

        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProjects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <Card hover className="cursor-pointer">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {project.generated_image_url ? (
                      <img
                        src={project.generated_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎨
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{project.status}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first AI design!</p>
            <Button onClick={() => navigate('/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </div>

      {/* Tips Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>💡 Pro Tip</CardTitle>
          <CardDescription className="text-gray-700">
            Use high-quality, well-lit photos for best results. Natural lighting works great!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Dashboard;
