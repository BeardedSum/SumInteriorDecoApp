import { create } from 'zustand';
import type { Transaction, CreditPackage, SubscriptionPlan } from '../types';
import apiService from '../services/api';

interface PaymentState {
  creditPackages: CreditPackage[];
  subscriptionPlans: SubscriptionPlan[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCreditPackages: () => Promise<void>;
  fetchSubscriptionPlans: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  initializePayment: (packageId: string) => Promise<{ authorizationUrl: string; reference: string }>;
  verifyPayment: (reference: string) => Promise<void>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  creditPackages: [],
  subscriptionPlans: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchCreditPackages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getCreditPackages();
      set({
        creditPackages: response.data || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch credit packages',
        isLoading: false,
      });
    }
  },

  fetchSubscriptionPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getSubscriptionPlans();
      set({
        subscriptionPlans: response.data || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch subscription plans',
        isLoading: false,
      });
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getTransactions();
      set({
        transactions: response.data || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch transactions',
        isLoading: false,
      });
    }
  },

  initializePayment: async (packageId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.initializePayment(packageId);
      set({ isLoading: false });
      return response.data!;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to initialize payment',
        isLoading: false,
      });
      throw error;
    }
  },

  verifyPayment: async (reference) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.verifyPayment(reference);
      const transaction = response.data!;

      set((state) => ({
        transactions: [transaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Payment verification failed',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
