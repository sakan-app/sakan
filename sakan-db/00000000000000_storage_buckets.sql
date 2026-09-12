-- SAKAN — 0) Storage buckets (run this FIRST, before the migrations)
insert into storage.buckets (id, name, public)
values
  ('avatars','avatars',false),
  ('gallery','gallery',false),
  ('chat-media','chat-media',false),
  ('wallpapers','wallpapers',false),
  ('featured','featured',false),
  ('verification','verification',false),
  ('documents','documents',false),
  ('temporary','temporary',false)
on conflict (id) do nothing;
