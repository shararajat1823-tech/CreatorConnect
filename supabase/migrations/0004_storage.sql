-- CreatorConnect — storage bucket and policies for creator avatars.
-- Images are limited to 5 MB and jpeg/png/webp at the storage layer.
-- Upload path convention: creator-avatars/<auth-uid>/<filename>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creator-avatars',
  'creator-avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read (the bucket is public; this policy also allows API listing).
create policy "avatars public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'creator-avatars');

-- Authenticated users can upload only into their own uid folder.
create policy "avatars owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'creator-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
