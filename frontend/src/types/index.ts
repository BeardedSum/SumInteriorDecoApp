// User & Authentication Types
export interface User {
  id: string;
  email: string | null;
  phone_number: string | null;
  full_name: string;
  avatar_url: string | null;
  credits_balance: number;
  user_type: 'free' | 'basic' | 'pro' | 'agency';
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email?: string;
  phone_number?: string;
  password: string;
}

export interface SignupData {
  email?: string;
  phone_number?: string;
  full_name: string;
  password: string;
}

// Project Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  room_type: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining_room' | 'office' | 'outdoor' | 'other' | null;
  original_image_url: string | null;
  generated_image_url: string | null;
  style_preset_id: string | null;
  settings: Record<string, any> | null;
  is_favorite: boolean;
  view_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

// Generation Job Types
export type GenerationMode = '3d_vision' | '2d_redesign' | 'virtual_staging' | 'freestyle' | 'object_removal' | 'color_material';

export interface GenerationJob {
  id: string;
  user_id: string;
  project_id: string | null;
  generation_mode: GenerationMode;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input_image_url: string | null;
  output_image_url: string | null;
  style_preset_id: string | null;
  prompt: string | null;
  creative_freedom: number;
  credits_cost: number;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationRequest {
  mode: GenerationMode;
  inputImage?: File;
  inputImageUrl?: string;
  stylePresetId: string;
  prompt?: string;
  creativeFreedom?: number;
  projectId?: string;
}

// Style Preset Types
export type StyleCategory = 'african' | 'luxury' | 'modern' | 'traditional' | 'eclectic' | 'retro';

export interface StylePreset {
  id: string;
  slug: string;
  name: string;
  category: StyleCategory;
  description: string | null;
  keywords: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  popularity: number;
  usage_count: number;
}

// Transaction & Payment Types
export interface Transaction {
  id: string;
  user_id: string;
  reference: string;
  transaction_type: 'credit_purchase' | 'subscription' | 'credit_deduction' | 'refund' | 'free_credits';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_provider: 'paystack' | 'flutterwave' | 'manual' | 'system' | null;
  amount: number;
  currency: string;
  credits_amount: number | null;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits_amount: number;
  price: number;
  currency: string;
  bonus_credits: number | null;
  is_active: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI State Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}
