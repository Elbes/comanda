-- Bucket público para fotos do cardápio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_gerencia_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images'
  AND public.has_role(ARRAY['gerencia'])
);

CREATE POLICY "menu_images_gerencia_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND public.has_role(ARRAY['gerencia'])
);

CREATE POLICY "menu_images_gerencia_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND public.has_role(ARRAY['gerencia'])
);
