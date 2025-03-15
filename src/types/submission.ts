export type SubmissionStatus = 'pending' | 'accepted' | 'rejected';

export interface SubmissionFormData {
  full_name: string;
  phone: string;
  location: string;
  email: string;
  hobbies: string;
  profile_picture: File | null;
  source_code: File | null;
}

export interface SubmissionResponse {
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
  status?: SubmissionStatus;
  created_at: string;
  updated_at: string;
}