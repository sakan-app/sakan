ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.featured_ads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_ads;