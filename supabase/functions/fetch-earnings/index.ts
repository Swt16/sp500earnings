import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AV_BASE = 'https://www.alphavantage.co/query';

async function fetchAV(fn: string, symbol: string, apiKey: string) {
  const url = `${AV_BASE}?function=${fn}&symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpha Vantage error [${res.status}]: ${text}`);
  }
  const raw = await res.json();
  if (raw['Note'] || raw['Information']) throw new Error(raw['Note'] || raw['Information']);
  if (raw['Error Message']) throw new Error(raw['Error Message']);
  return raw;
}

function buildEntries(incomeRaw: any, earningsRaw: any, cashFlowRaw: any) {
  const quarterlyReports = incomeRaw.quarterlyReports;
  if (!quarterlyReports || quarterlyReports.length === 0) return [];

  const epsMap = new Map<string, number>();
  if (earningsRaw.quarterlyEarnings) {
    for (const e of earningsRaw.quarterlyEarnings) {
      const eps = parseFloat(e.reportedEPS);
      if (!isNaN(eps)) epsMap.set(e.fiscalDateEnding, eps);
    }
  }

  const capexMap = new Map<string, number>();
  if (cashFlowRaw.quarterlyReports) {
    for (const r of cashFlowRaw.quarterlyReports) {
      const capex = parseFloat(r.capitalExpenditures);
      if (!isNaN(capex)) capexMap.set(r.fiscalDateEnding, Math.abs(capex));
    }
  }

  return quarterlyReports
    .slice(0, 20)
    .map((item: any) => {
      const dateStr = item.fiscalDateEnding;
      const date = new Date(dateStr);
      const q = Math.floor(date.getMonth() / 3) + 1;
      const quarter = `Q${q} ${date.getFullYear()}`;
      const revenue = parseFloat(item.totalRevenue) || 0;
      const grossProfit = parseFloat(item.grossProfit) || 0;
      const operatingIncome = parseFloat(item.operatingIncome) || 0;
      const netIncome = parseFloat(item.netIncome) || 0;
      const eps = epsMap.get(dateStr) ?? 0;
      const capex = capexMap.get(dateStr) ?? 0;

      return {
        quarter,
        revenue: Number((revenue / 1e9).toFixed(2)),
        eps: Number(eps.toFixed(2)),
        netIncome: Number((netIncome / 1e9).toFixed(2)),
        capex: Number((capex / 1e9).toFixed(2)),
        summary: `Revenue: $${(revenue / 1e9).toFixed(1)}B | Gross Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0'}% | Op. Income: $${(operatingIncome / 1e9).toFixed(1)}B`,
      };
    })
    .reverse();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, ticker } = await req.json();

    if (action === 'earnings' && ticker) {
      const upperTicker = ticker.toUpperCase();
      const pricesCacheKey = `${upperTicker}_PRICES`;

      // Check earnings cache
      const { data: cachedEarnings } = await supabase
        .from('earnings_cache')
        .select('data, fetched_at')
        .eq('ticker', upperTicker)
        .single();

      // Check prices cache
      const { data: cachedPrices } = await supabase
        .from('earnings_cache')
        .select('data, fetched_at')
        .eq('ticker', pricesCacheKey)
        .single();

      const ONE_DAY = 24 * 60 * 60 * 1000;
      const earningsFresh = cachedEarnings && (Date.now() - new Date(cachedEarnings.fetched_at).getTime() < ONE_DAY);
      const pricesFresh = cachedPrices && (Date.now() - new Date(cachedPrices.fetched_at).getTime() < ONE_DAY);

      // If both are cached, return immediately
      if (earningsFresh && pricesFresh) {
        return new Response(
          JSON.stringify({ ticker, data: cachedEarnings.data, monthlyPrices: cachedPrices.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let entries = earningsFresh ? cachedEarnings.data : null;
      let priceEntries = pricesFresh ? cachedPrices.data : null;

      // Fetch earnings if stale
      if (!entries) {
        const incomeRaw = await fetchAV('INCOME_STATEMENT', ticker, apiKey);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const earningsRaw = await fetchAV('EARNINGS', ticker, apiKey);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const cashFlowRaw = await fetchAV('CASH_FLOW', ticker, apiKey);

        entries = buildEntries(incomeRaw, earningsRaw, cashFlowRaw);

        await supabase.from('earnings_cache').upsert(
          { ticker: upperTicker, data: entries, fetched_at: new Date().toISOString() },
          { onConflict: 'ticker' }
        );
      }

      // Fetch prices if stale
      if (!priceEntries) {
        if (!earningsFresh) {
          // We just made API calls above, add delay
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
        const raw = await fetchAV('TIME_SERIES_MONTHLY', ticker, apiKey);
        const monthly = raw['Monthly Time Series'];
        if (monthly) {
          priceEntries = Object.entries(monthly)
            .slice(0, 60)
            .map(([date, vals]: [string, any]) => ({
              date,
              close: Number(parseFloat(vals['4. close']).toFixed(2)),
              volume: parseInt(vals['5. volume'], 10),
            }))
            .reverse();

          await supabase.from('earnings_cache').upsert(
            { ticker: pricesCacheKey, data: priceEntries, fetched_at: new Date().toISOString() },
            { onConflict: 'ticker' }
          );
        }
      }

      return new Response(
        JSON.stringify({ ticker, data: entries, monthlyPrices: priceEntries ?? [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "earnings" with a ticker.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in fetch-earnings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
