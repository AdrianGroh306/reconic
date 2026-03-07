-- ============================================================
-- THUMBNAILS STORAGE BUCKET
-- Public bucket. Files live at: {userId}/{projectId}.jpg
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/replace their own files
CREATE POLICY "Users can upload own thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access (thumbnails are shown on project cards)
CREATE POLICY "Thumbnails are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');
