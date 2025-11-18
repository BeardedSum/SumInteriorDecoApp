import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, SignupData } from '../types';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  sendOTP: () => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.login(credentials);
          const { user, tokens } = response.data!;

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.signup(data);
          const { user, tokens } = response.data!;

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await apiService.getProfile();
          set({
            user: response.data!,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to fetch profile',
            isLoading: false,
          });
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      sendOTP: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiService.sendOTP();
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to send OTP',
            isLoading: false,
          });
          throw error;
        }
      },

      verifyOTP: async (otp) => {
        set({ isLoading: true, error: null });
        try {
          await apiService.verifyOTP(otp);
          // Update user to mark phone as verified
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, phone_verified: true },
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Invalid OTP',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
