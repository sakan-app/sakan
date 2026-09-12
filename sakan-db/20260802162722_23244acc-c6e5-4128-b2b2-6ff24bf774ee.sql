-- Path convention for every bucket: "<user_id>/<filename>"

-- ---------- owner-managed uploads across all buckets ----------
CREATE POLICY "storage_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- member-visible imagery (avatars + gallery) ----------
CREATE POLICY "storage_members_view_imagery" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('avatars','gallery')
    AND (storage.foldername(name))[1] <> auth.uid()::text
    AND NOT public.is_blocked_between(auth.uid(), ((storage.foldername(name))[1])::uuid)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden
    )
  );

-- ---------- staff review access (verification + documents) ----------
CREATE POLICY "storage_staff_review" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification','documents')
    AND public.is_staff(auth.uid())
  );