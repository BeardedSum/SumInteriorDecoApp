import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  User,
  AuthTokens,
  LoginCredentials,
  SignupData,
  Project,
  GenerationJob,
  StylePreset,
  Transaction,
  CreditPackage,
  SubscriptionPlan,
  GenerationRequest,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post<ApiResponse<AuthTokens>>(`${API_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data.data!;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ===== Authentication =====
  async signup(data: SignupData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async sendOTP(): Promise<ApiResponse> {
    const response = await this.api.post('/auth/send-otp');
    return response.data;
  }

  async verifyOTP(otp: string): Promise<ApiResponse> {
    const response = await this.api.post('/auth/verify-otp', { otp });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return response.data;
  }

  // ===== Projects =====
  async getProjects(): Promise<ApiResponse<Project[]>> {
    const response = await this.api.get('/projects');
    return response.data;
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: Partial<Project>): Promise<ApiResponse<Project>> {
    const response = await this.api.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    const response = await this.api.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/projects/${id}`);
    return response.data;
  }

  async toggleFavorite(id: string): Promise<ApiResponse<Project>> {
    const response = await this.api.post(`/projects/${id}/favorite`);
    return response.data;
  }

  // ===== Generation =====
  async generateImage(request: GenerationRequest): Promise<ApiResponse<GenerationJob>> {
    const formData = new FormData();
    formData.append('mode', request.mode);
    formData.append('stylePresetId', request.stylePresetId);

    if (request.inputImage) {
      formData.append('inputImage', request.inputImage);
    }
    if (request.inputImageUrl) {
      formData.append('inputImageUrl', request.inputImageUrl);
    }
    if (request.prompt) {
      formData.append('prompt', request.prompt);
    }
    if (request.creativeFreedom !== undefined) {
      formData.append('creativeFreedom', request.creativeFreedom.toString());
    }
    if (request.projectId) {
      formData.append('projectId', request.projectId);
    }

    const response = await this.api.post('/generation/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getGenerationJob(id: string): Promise<ApiResponse<GenerationJob>> {
    const response = await this.api.get(`/generation/jobs/${id}`);
    return response.data;
  }

  async getGenerationJobs(): Promise<ApiResponse<GenerationJob[]>> {
    const response = await this.api.get('/generation/jobs');
    return response.data;
  }

  async analyzeImage(imageUrl: string): Promise<ApiResponse<any>> {
    const response = await this.api.post('/generation/analyze', { image_url: imageUrl });
    return response.data;
  }

  async getDesignConsultation(data: {
    requirements: string;
    room_type: string;
    budget?: number;
    preferences?: string[];
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/generation/consultation', data);
    return response.data;
  }

  // ===== Styles =====
  async getStyles(): Promise<ApiResponse<StylePreset[]>> {
    const response = await this.api.get('/styles');
    return response.data;
  }

  async getStylesByCategory(category: string): Promise<ApiResponse<StylePreset[]>> {
    const response = await this.api.get(`/styles/category/${category}`);
    return response.data;
  }

  async getStyle(id: string): Promise<ApiResponse<StylePreset>> {
    const response = await this.api.get(`/styles/${id}`);
    return response.data;
  }

  async getStyleCategories(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/styles/categories');
    return response.data;
  }

  async getPopularStyles(limit: number = 10): Promise<ApiResponse<StylePreset[]>> {
    const response = await this.api.get(`/styles/popular?limit=${limit}`);
    return response.data;
  }

  // ===== Payments & Credits =====
  async getCreditPackages(): Promise<ApiResponse<CreditPackage[]>> {
    const response = await this.api.get('/payments/credit-packages');
    return response.data;
  }

  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const response = await this.api.get('/payments/subscription-plans');
    return response.data;
  }

  async initializePayment(packageId: string): Promise<ApiResponse<{ authorizationUrl: string; reference: string }>> {
    const response = await this.api.post('/payments/initialize', { packageId });
    return response.data;
  }

  async verifyPayment(reference: string): Promise<ApiResponse<Transaction>> {
    const response = await this.api.get(`/payments/verify/${reference}`);
    return response.data;
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    const response = await this.api.get('/payments/transactions');
    return response.data;
  }

  // ===== Image Upload =====
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
