
CREATE TABLE public.earnings_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_ticker UNIQUE (ticker)
);

-- Allow public read/write since this is a server-side cache accessed via edge functions with service role
ALTER TABLE public.earnings_cache ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (using service role) full access
CREATE POLICY "Service role full access" ON public.earnings_cache
  FOR ALL USING (true) WITH CHECK (true);
