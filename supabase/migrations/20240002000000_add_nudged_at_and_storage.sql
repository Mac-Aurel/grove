-- Add nudged_at to friendships for rate-limiting nudges
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS nudged_at timestamptz;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'task-photos',
    'task-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies: task-photos
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read task photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'task-photos');

CREATE POLICY "Users can delete own task photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies: avatars
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
