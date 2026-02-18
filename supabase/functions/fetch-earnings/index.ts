import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AV_BASE = 'https://www.alphavantage.co/query';

// Known stock splits: ticker -> array of { date, ratio }
// ratio means old shares become ratio new shares (e.g., 10:1 = ratio 10)
const KNOWN_SPLITS: Record<string, { date: string; ratio: number }[]> = {
  NVDA: [{ date: '2024-06-10', ratio: 10 }, { date: '2021-07-20', ratio: 4 }],
  AMZN: [{ date: '2022-06-06', ratio: 20 }],
  GOOGL: [{ date: '2022-07-18', ratio: 20 }],
  GOOG: [{ date: '2022-07-18', ratio: 20 }],
  TSLA: [{ date: '2022-08-25', ratio: 3 }],
  SHOP: [{ date: '2022-06-29', ratio: 10 }],
  PANW: [{ date: '2024-12-16', ratio: 2 }, { date: '2022-09-14', ratio: 3 }],
  DXCM: [{ date: '2022-06-10', ratio: 4 }],
  CMG: [{ date: '2024-06-26', ratio: 50 }],
  AVGO: [{ date: '2024-07-15', ratio: 10 }],
  WMT: [{ date: '2024-02-26', ratio: 3 }],
  LRCX: [{ date: '2024-10-03', ratio: 10 }],
  SONY: [{ date: '2024-10-09', ratio: 5 }],
  GE: [{ date: '2021-08-02', ratio: 0.125 }], // reverse split 1:8
  WBA: [{ date: '2024-01-01', ratio: 0.125 }], // reverse split
  // 2025 splits
  NOW: [{ date: '2025-12-18', ratio: 5 }],
  NFLX: [{ date: '2025-11-17', ratio: 10 }],
  IBKR: [{ date: '2025-06-18', ratio: 4 }],
  ORLY: [{ date: '2025-06-10', ratio: 15 }],
  FAST: [{ date: '2025-05-22', ratio: 2 }],
  // 2024 splits (not previously listed)
  TSCO: [{ date: '2024-12-20', ratio: 5 }],
  SMCI: [{ date: '2024-10-01', ratio: 10 }],
  DECK: [{ date: '2024-09-17', ratio: 6 }],
  CTAS: [{ date: '2024-09-13', ratio: 4 }],
  WSM: [{ date: '2024-07-09', ratio: 2 }],
  APH: [{ date: '2024-06-12', ratio: 2 }],
  ODFL: [{ date: '2024-03-28', ratio: 2 }],
  // 2023 splits
  CPRT: [{ date: '2023-10-16', ratio: 2 }],
  MNST: [{ date: '2023-03-28', ratio: 2 }],
  PCAR: [{ date: '2023-02-08', ratio: 1.5 }], // 3-for-2
  // 2022 splits (not previously listed)
  FTNT: [{ date: '2022-06-23', ratio: 5 }],
  // 2021 splits (not previously listed)
  MCHP: [{ date: '2021-10-12', ratio: 2 }],
  ISRG: [{ date: '2021-10-05', ratio: 3 }],
  RJF: [{ date: '2021-09-21', ratio: 1.5 }], // 3-for-2
  CSGP: [{ date: '2021-06-29', ratio: 10 }],
  CSX: [{ date: '2021-06-28', ratio: 3 }],
  SHW: [{ date: '2021-04-01', ratio: 3 }],
};

function adjustForSplits(ticker: string, entries: { date: string; close: number; volume: number }[]) {
  const splits = KNOWN_SPLITS[ticker.toUpperCase()];
  if (!splits || splits.length === 0) return entries;

  return entries.map((entry) => {
    let adjustedClose = entry.close;
    let adjustedVolume = entry.volume;
    for (const split of splits) {
      if (entry.date < split.date) {
        adjustedClose = adjustedClose / split.ratio;
        adjustedVolume = Math.round(adjustedVolume * split.ratio);
      }
    }
    return {
      ...entry,
      close: Number(adjustedClose.toFixed(2)),
      volume: adjustedVolume,
    };
  });
}

async function fetchAV(fn: string, symbol: string, apiKey: string, retries = 3) {
  const url = `${AV_BASE}?function=${fn}&symbol=${symbol}&apikey=${apiKey}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url);

    // Retry on 5xx errors
    if (res.status >= 500 && attempt < retries) {
      console.warn(`Alpha Vantage returned ${res.status} for ${fn}, retry ${attempt}/${retries}...`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
      continue;
    }

    // Validate content-type before parsing
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (text.trim().startsWith('<!') || text.includes('<html')) {
        throw new Error(`Alpha Vantage returned HTML (status ${res.status}). The API may be temporarily unavailable. Please try again later.`);
      }
      throw new Error(`Alpha Vantage unexpected response format: ${contentType}, status ${res.status}`);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Alpha Vantage error [${res.status}]: ${text}`);
    }

    const raw = await res.json();
    if (raw['Note'] || raw['Information']) throw new Error(raw['Note'] || raw['Information']);
    if (raw['Error Message']) throw new Error(raw['Error Message']);
    return raw;
  }
  throw new Error('Alpha Vantage API is temporarily unavailable after multiple retries. Please try again later.');
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

      const grossMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
      const operatingMargin = revenue > 0 ? Number(((operatingIncome / revenue) * 100).toFixed(1)) : 0;

      return {
        quarter,
        revenue: Number((revenue / 1e9).toFixed(2)),
        eps: Number(eps.toFixed(2)),
        netIncome: Number((netIncome / 1e9).toFixed(2)),
        capex: Number((capex / 1e9).toFixed(2)),
        grossMargin,
        operatingMargin,
        summary: `Revenue: $${(revenue / 1e9).toFixed(1)}B | Gross Margin: ${grossMargin}% | Op. Margin: ${operatingMargin}% | Op. Income: $${(operatingIncome / 1e9).toFixed(1)}B`,
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

    // Validate ticker input
    if (action === 'earnings') {
      if (!ticker || typeof ticker !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Ticker must be a non-empty string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const tickerRegex = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
      if (!tickerRegex.test(ticker.toUpperCase())) {
        return new Response(
          JSON.stringify({ error: 'Invalid ticker format. Must be 1-5 letters.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'earnings' && ticker) {
      const upperTicker = ticker.toUpperCase();
      // Alpha Vantage uses hyphens for share class tickers (e.g. BRK-B, BF-B)
      const avTicker = upperTicker.replace('.', '-');
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

      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const earningsFresh = cachedEarnings && (Date.now() - new Date(cachedEarnings.fetched_at).getTime() < SEVEN_DAYS);
      const pricesFresh = cachedPrices && (Date.now() - new Date(cachedPrices.fetched_at).getTime() < SEVEN_DAYS);

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
        const incomeRaw = await fetchAV('INCOME_STATEMENT', avTicker, apiKey);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const earningsRaw = await fetchAV('EARNINGS', avTicker, apiKey);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const cashFlowRaw = await fetchAV('CASH_FLOW', avTicker, apiKey);

        entries = buildEntries(incomeRaw, earningsRaw, cashFlowRaw);

        // If earnings empty and ticker has a share class suffix (e.g. BF-B), try A-class
        if (entries.length === 0 && /^[A-Z]+-[A-Z]$/.test(avTicker)) {
          const aTicker = avTicker.replace(/-[A-Z]$/, '-A');
          console.log(`No earnings for ${avTicker}, trying A-class: ${aTicker}`);
          await new Promise(resolve => setTimeout(resolve, 1200));
          const incomeA = await fetchAV('INCOME_STATEMENT', aTicker, apiKey);
          await new Promise(resolve => setTimeout(resolve, 1200));
          const earningsA = await fetchAV('EARNINGS', aTicker, apiKey);
          await new Promise(resolve => setTimeout(resolve, 1200));
          const cashFlowA = await fetchAV('CASH_FLOW', aTicker, apiKey);
          entries = buildEntries(incomeA, earningsA, cashFlowA);
        }

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
        const raw = await fetchAV('TIME_SERIES_MONTHLY', avTicker, apiKey);
        const monthly = raw['Monthly Time Series'];
        if (monthly) {
          const rawEntries = Object.entries(monthly)
            .slice(0, 60)
            .map(([date, vals]: [string, any]) => ({
              date,
              close: Number(parseFloat(vals['4. close']).toFixed(2)),
              volume: parseInt(vals['5. volume'], 10),
            }))
            .reverse();

          priceEntries = adjustForSplits(upperTicker, rawEntries);

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
