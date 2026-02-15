-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role full access" ON public.earnings_cache;

-- Deny all direct access for anon and authenticated users
-- The edge function uses service role key which bypasses RLS
CREATE POLICY "Deny direct client access"
ON public.earnings_cache
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);