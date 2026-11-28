-- Every storage bucket in the project (images, avatars, travel-posts,
-- trip-documents, trip-chat, check-in-photos, covers) was created with no
-- file_size_limit and no allowed_mime_types — so despite every upload call
-- site in the app only ever sending a photo (checked: avatar.ts,
-- checkInPhoto.ts, coverPhoto.ts, travelPosts.ts, tripChatMedia.ts,
-- tripDocuments.ts all default contentType to image/jpeg), the actual
-- storage API accepted a file of any type or size from anyone who could
-- write to that bucket's path — unrestricted file upload (OWASP Mobile
-- M9-adjacent: resource exhaustion, storing an unexpected file type under a
-- public bucket). Supabase Storage enforces both at the API level once set
-- here, with zero app-code changes needed since every call already sends a
-- real image.
update storage.buckets
set
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id in ('images', 'avatars', 'travel-posts', 'trip-documents', 'trip-chat', 'check-in-photos', 'covers');
