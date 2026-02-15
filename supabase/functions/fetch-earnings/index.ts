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
      // Check cache first (valid for 24 hours)
      const { data: cached } = await supabase
        .from('earnings_cache')
        .select('data, fetched_at')
        .eq('ticker', ticker.toUpperCase())
        .single();

      if (cached) {
        const age = Date.now() - new Date(cached.fetched_at).getTime();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (age < ONE_DAY) {
          return new Response(
            JSON.stringify({ ticker, data: cached.data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Cache miss or stale — fetch from Alpha Vantage
      const incomeRaw = await fetchAV('INCOME_STATEMENT', ticker, apiKey);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const earningsRaw = await fetchAV('EARNINGS', ticker, apiKey);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const cashFlowRaw = await fetchAV('CASH_FLOW', ticker, apiKey);

      const entries = buildEntries(incomeRaw, earningsRaw, cashFlowRaw);

      if (entries.length === 0) {
        return new Response(
          JSON.stringify({ ticker, data: [], message: 'No quarterly data available' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upsert into cache
      await supabase.from('earnings_cache').upsert(
        { ticker: ticker.toUpperCase(), data: entries, fetched_at: new Date().toISOString() },
        { onConflict: 'ticker' }
      );

      return new Response(
        JSON.stringify({ ticker, data: entries }),
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
