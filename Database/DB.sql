-- Create a custom type for user roles
CREATE TYPE user_role AS ENUM ('developer', 'evaluator');

-- Create a submissions table to store developer submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  email TEXT NOT NULL,
  hobbies TEXT NOT NULL,
  profile_picture TEXT,  -- URL to the stored profile picture
  source_code TEXT,      -- URL to the stored source code zip
  feedback TEXT,         -- Feedback from evaluator
  status TEXT,           -- 'pending', 'accepted', or 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a view that joins user information with their role
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  au.id,
  au.email,
  COALESCE(raw_user_meta_data->>'role', 'developer')::user_role as role
FROM auth.users au;

-- Set up Row Level Security (RLS)
-- Enable RLS on the submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for the submissions table
-- Developers can only see and update their own submissions
CREATE POLICY "Developers can view their own submissions" 
ON submissions FOR SELECT 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Developers can insert their own submissions" 
ON submissions FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'developer')
);

CREATE POLICY "Developers can update their own submissions" 
ON submissions FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'developer')
);

-- Evaluators can view all submissions
CREATE POLICY "Evaluators can view all submissions" 
ON submissions FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'evaluator')
);

-- Evaluators can update feedback and status
CREATE POLICY "Evaluators can update feedback and status" 
ON submissions FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'evaluator')
) 
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'evaluator')
);

-- Create function to handle user creation with role
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Set default role if not specified
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"developer"'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set default role on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();