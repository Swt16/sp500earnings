const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = 'https://financialmodelingprep.com/stable';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('FMP_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'FMP_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, ticker } = await req.json();

    if (action === 'earnings' && ticker) {
      // Free tier: limit=5 max
      const res = await fetch(
        `${FMP_BASE}/income-statement?symbol=${ticker}&period=quarter&limit=5&apikey=${apiKey}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`FMP error [${res.status}]: ${text}`);
      }
      const incomeData = await res.json();

      if (!Array.isArray(incomeData) || incomeData.length === 0) {
        return new Response(
          JSON.stringify({ ticker, data: [], message: 'No data available for this ticker' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const entries = incomeData
        .map((item: any) => {
          const year = item.calendarYear || new Date(item.date).getFullYear();
          const quarter = item.period ? `${item.period} ${year}` : `Q1 ${year}`;
          const revenue = item.revenue || 0;
          const grossProfit = item.grossProfit || 0;
          const operatingIncome = item.operatingIncome || 0;

          return {
            quarter,
            revenue: Number((revenue / 1e9).toFixed(2)),
            eps: Number((item.eps ?? 0).toFixed(2)),
            netIncome: Number(((item.netIncome || 0) / 1e9).toFixed(2)),
            capex: Number((Math.abs(item.capitalExpenditure || 0) / 1e9).toFixed(2)),
            summary: `Revenue: $${(revenue / 1e9).toFixed(1)}B | Gross Margin: ${revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0}% | Op. Income: $${(operatingIncome / 1e9).toFixed(1)}B`,
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
