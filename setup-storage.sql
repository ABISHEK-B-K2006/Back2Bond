-- Create storage bucket for media uploads
-- Run this in your Supabase SQL editor or when local development is set up

-- Create media bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for media bucket
CREATE POLICY "Users can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Media files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Users can update their own media files" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media files" ON storage.objects
  FOR DELETE WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);