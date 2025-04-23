export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          price: number
          stripe_product_id?: string
          // Add other fields as needed
        }
        Insert: {
          id: string
          title: string
          price: number
          stripe_product_id?: string
          // Add other fields as needed
        }
        Update: {
          id?: string
          title?: string
          price?: number
          stripe_product_id?: string
          // Add other fields as needed
        }
      }
      user_courses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          // Add other fields as needed
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          // Add other fields as needed
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          // Add other fields as needed
        }
      }
      // Add other tables as needed
    }
    Views: {
      // Add views as needed
    }
    Functions: {
      // Add functions as needed
    }
  }
} 