import { create } from 'zustand';
import type { GenerationJob, GenerationRequest, StylePreset } from '../types';
import apiService from '../services/api';

interface GenerationState {
  currentJob: GenerationJob | null;
  jobs: GenerationJob[];
  styles: StylePreset[];
  selectedStyle: StylePreset | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;

  // Actions
  generateImage: (request: GenerationRequest) => Promise<GenerationJob>;
  fetchGenerationJob: (id: string) => Promise<void>;
  fetchGenerationJobs: () => Promise<void>;
  fetchStyles: () => Promise<void>;
  setSelectedStyle: (style: StylePreset | null) => void;
  clearCurrentJob: () => void;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  currentJob: null,
  jobs: [],
  styles: [],
  selectedStyle: null,
  isGenerating: false,
  progress: 0,
  error: null,

  generateImage: async (request) => {
    set({ isGenerating: true, progress: 0, error: null });

    try {
      const response = await apiService.generateImage(request);
      const job = response.data!;

      set({
        currentJob: job,
        progress: 10,
      });

      // Poll for job completion
      const pollJob = async () => {
        const jobResponse = await apiService.getGenerationJob(job.id);
        const updatedJob = jobResponse.data!;

        set({ currentJob: updatedJob });

        if (updatedJob.status === 'processing') {
          set((state) => ({
            progress: Math.min(state.progress + 10, 90),
          }));
          setTimeout(pollJob, 2000); // Poll every 2 seconds
        } else if (updatedJob.status === 'completed') {
          set({
            progress: 100,
            isGenerating: false,
          });
        } else if (updatedJob.status === 'failed') {
          set({
            error: updatedJob.error_message || 'Generation failed',
            isGenerating: false,
          });
        }
      };

      // Start polling after initial creation
      if (job.status === 'queued' || job.status === 'processing') {
        setTimeout(pollJob, 2000);
      }

      return job;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to start generation',
        isGenerating: false,
        progress: 0,
      });
      throw error;
    }
  },

  fetchGenerationJob: async (id) => {
    try {
      const response = await apiService.getGenerationJob(id);
      set({ currentJob: response.data! });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch generation job',
      });
    }
  },

  fetchGenerationJobs: async () => {
    try {
      const response = await apiService.getGenerationJobs();
      set({ jobs: response.data || [] });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch generation jobs',
      });
    }
  },

  fetchStyles: async () => {
    try {
      const response = await apiService.getStyles();
      set({ styles: response.data || [] });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch styles',
      });
    }
  },

  setSelectedStyle: (style) => set({ selectedStyle: style }),

  clearCurrentJob: () => set({ currentJob: null, progress: 0 }),

  clearError: () => set({ error: null }),
}));
