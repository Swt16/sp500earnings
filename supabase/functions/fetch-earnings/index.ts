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

  try {
    const { action, ticker } = await req.json();

    if (action === 'earnings' && ticker) {
      // Fetch income statement and earnings in parallel
      const [incomeRaw, earningsRaw] = await Promise.all([
        fetchAV('INCOME_STATEMENT', ticker, apiKey),
        fetchAV('EARNINGS', ticker, apiKey),
      ]);

      const quarterlyReports = incomeRaw.quarterlyReports;
      if (!quarterlyReports || quarterlyReports.length === 0) {
        return new Response(
          JSON.stringify({ ticker, data: [], message: 'No quarterly data available' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build EPS lookup from EARNINGS endpoint
      const epsMap = new Map<string, number>();
      if (earningsRaw.quarterlyEarnings) {
        for (const e of earningsRaw.quarterlyEarnings) {
          // Key by fiscalDateEnding
          const eps = parseFloat(e.reportedEPS);
          if (!isNaN(eps)) {
            epsMap.set(e.fiscalDateEnding, eps);
          }
        }
      }

      const entries = quarterlyReports
        .slice(0, 20)
        .map((item: any) => {
          const dateStr = item.fiscalDateEnding;
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = date.getMonth();
          const q = Math.floor(month / 3) + 1;
          const quarter = `Q${q} ${year}`;

          const revenue = parseFloat(item.totalRevenue) || 0;
          const grossProfit = parseFloat(item.grossProfit) || 0;
          const operatingIncome = parseFloat(item.operatingIncome) || 0;
          const netIncome = parseFloat(item.netIncome) || 0;
          const eps = epsMap.get(dateStr) ?? 0;

          return {
            quarter,
            revenue: Number((revenue / 1e9).toFixed(2)),
            eps: Number(eps.toFixed(2)),
            netIncome: Number((netIncome / 1e9).toFixed(2)),
            capex: 0,
            summary: `Revenue: $${(revenue / 1e9).toFixed(1)}B | Gross Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0'}% | Op. Income: $${(operatingIncome / 1e9).toFixed(1)}B`,
          };
        })
        .reverse();

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
