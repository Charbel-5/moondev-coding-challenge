export type EvaluationStatus = 'pending' | 'accepted' | 'rejected';

export interface DeveloperSubmission {
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
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
  };
}

export interface EvaluationDecision {
  submission_id: string;
  status: 'accepted' | 'rejected';
  feedback: string;
}
