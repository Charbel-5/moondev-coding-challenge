export type UserRole = 'developer' | 'evaluator';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
}

export interface Submission {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  location: string;
  email: string;
  hobbies: string;
  profile_picture?: string;
  source_code?: string;
  feedback?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Submission, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      user_profiles: {
        Row: Profile;
      };
    };
    Functions: {
      [key: string]: unknown;
    };
  };
}