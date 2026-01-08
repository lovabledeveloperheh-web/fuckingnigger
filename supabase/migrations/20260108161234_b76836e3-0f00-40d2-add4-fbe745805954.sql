-- Create storage bucket for user files if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-files bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to shared files via share token lookup
CREATE POLICY "Public can access shared files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files'
  AND EXISTS (
    SELECT 1 FROM public.shared_links sl
    JOIN public.files f ON sl.file_id = f.id
    WHERE f.storage_path = name
    AND (sl.expires_at IS NULL OR sl.expires_at > now())
    AND (sl.max_downloads IS NULL OR sl.download_count < sl.max_downloads)
  )
);