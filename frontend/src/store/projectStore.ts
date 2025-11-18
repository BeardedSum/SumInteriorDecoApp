import { create } from 'zustand';
import type { Project } from '../types';
import apiService from '../services/api';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getProjects();
      set({
        projects: response.data || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch projects',
        isLoading: false,
      });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getProject(id);
      set({
        currentProject: response.data!,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch project',
        isLoading: false,
      });
    }
  },

  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createProject(data);
      const newProject = response.data!;

      set((state) => ({
        projects: [newProject, ...state.projects],
        currentProject: newProject,
        isLoading: false,
      }));

      return newProject;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create project',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateProject(id, data);
      const updatedProject = response.data!;

      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update project',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteProject(id);

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete project',
        isLoading: false,
      });
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    try {
      const response = await apiService.toggleFavorite(id);
      const updatedProject = response.data!;

      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to toggle favorite',
      });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}));
