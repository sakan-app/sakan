ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'premium';
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_archived_idx ON public.notifications (user_id, archived_at);