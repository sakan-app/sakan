CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--984df44d-eadb-44e1-828c-5366b146869c.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-token', 'd4dfa6f2406490a2091104717dd5d3f23f5206184b6f4f20'
    ),
    body := jsonb_build_object('notificationId', NEW.id),
    timeout_milliseconds := 20000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Immediate push dispatch enqueue failed for notification %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_push_on_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_push_on_notification() TO service_role;

DROP TRIGGER IF EXISTS dispatch_push_on_notification_trigger ON public.notifications;
CREATE TRIGGER dispatch_push_on_notification_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_on_notification();

SELECT cron.unschedule('sakan-push-dispatch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sakan-push-dispatch');