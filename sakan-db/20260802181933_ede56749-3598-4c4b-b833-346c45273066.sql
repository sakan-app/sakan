
DELETE FROM public.billing_events;
DELETE FROM public.payments WHERE provider = 'manual';
DELETE FROM public.subscriptions WHERE provider = 'manual';
