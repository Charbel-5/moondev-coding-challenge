-- For profile-pictures bucket
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Allow users to upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own profile pictures
CREATE POLICY "Allow users to update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own profile pictures
CREATE POLICY "Allow users to read their own profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow evaluators to read all profile pictures
CREATE POLICY "Allow evaluators to read all profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'evaluator'
  )
);

-- For source-code bucket
-- Allow authenticated users to upload their own source code
CREATE POLICY "Allow users to upload their own source code"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'source-code' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own source code
CREATE POLICY "Allow users to read their own source code"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'source-code' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow evaluators to read all source code
CREATE POLICY "Allow evaluators to read all source code"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'source-code' AND 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'evaluator'
  )
);