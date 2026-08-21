-- 1. featured_ads: anon may only read display columns
REVOKE SELECT ON public.featured_ads FROM anon;
GRANT SELECT (
  id, image_path, headline, subtitle, target_url, status,
  starts_at, ends_at, created_at
) ON public.featured_ads TO anon;

-- 2. commercial_ads: hide advertiser_email from anon and authenticated
REVOKE SELECT ON public.commercial_ads FROM anon, authenticated;
GRANT SELECT (
  id, slot_key, advertiser_name, headline, image_path, image_url, target_url,
  duration_key, amount_cents, currency, status, paid_at, starts_at, ends_at,
  created_at, updated_at
) ON public.commercial_ads TO anon, authenticated;

-- 3. founding-membership helpers are not public API
REVOKE EXECUTE ON FUNCTION public.claim_founding_membership(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_founding_member(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_founding_member(uuid) TO authenticated;