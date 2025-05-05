import type { Content, Part } from '@google/generative-ai';

export interface User {
  id: string;
  email: string;
  // isAdmin is always false in the user app, kept for compatibility with shared backend
  isAdmin: boolean;
  last_sign_in_at?: string;
  user_metadata?: {
    // is_admin is ignored in the user app, but kept for compatibility with shared backend
    is_admin?: boolean;
    preferences?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
}

export interface Thread {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  thread_id: string;
  user_id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

export interface GeminiMessage extends Content {
  role: 'user' | 'model';
  parts: Part[];
}

export interface ErrorLog {
  id: string;
  message: string;
  stack_trace?: string;
  investigated: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
  error_data?: Record<string, unknown>;
}

export interface ModelData {
  id: string;
  name: string;
  provider: string;
  model_version: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  authInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

// Flashcard Types
export interface Subject {
  id: string;
  name: string;
  description: string;
  is_official: boolean;
  created_at: string;
  user_id: string;
}

export interface ExamType {
  id: string;
  name: string;
  description: string;
}

export interface FlashcardCollection {
  id: string;
  title: string;
  description: string;
  created_at: string;
  user_id: string;
  is_official: boolean;
  flashcards_count?: number;
  // Optional subjects from many-to-many relationship
  subjects?: Subject[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  is_mastered: boolean;
  created_at: string;
  user_id: string;
  created_by: string;
  is_official: boolean;
  difficulty_level?: string;
  is_common_pitfall?: boolean;
  is_public_sample?: boolean;
  // Optional collections, subjects and exam types from many-to-many relationships
  collections?: FlashcardCollection[];
  subjects?: Subject[];
  exam_types?: ExamType[];
  // Backward compatibility for UI that expects collection directly
  collection?: {
    id: string;
    title: string;
    subject?: {
      name: string;
      id: string;
    }
  };
}