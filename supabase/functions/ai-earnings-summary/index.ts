const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate the request includes the Supabase anon key
  const requestApiKey = req.headers.get('apikey');
  const expectedAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!requestApiKey || requestApiKey !== expectedAnonKey) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { ticker, companyName, earningsData } = await req.json();

    // Validate ticker
    if (!ticker || typeof ticker !== 'string' || !/^[A-Z]{1,5}$/i.test(ticker)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ticker format. Must be 1-5 letters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate companyName
    if (!companyName || typeof companyName !== 'string' || companyName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid companyName parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!earningsData || !Array.isArray(earningsData) || earningsData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid earningsData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recentQuarters = earningsData.slice(-8);
    const dataStr = recentQuarters.map((q: any) =>
      `${q.quarter}: Revenue $${q.revenue}B, EPS $${q.eps}, Net Income $${q.netIncome}B, CapEx $${q.capex ?? 0}B, Gross Margin ${q.grossMargin ?? 'N/A'}%, Op Margin ${q.operatingMargin ?? 'N/A'}%`
    ).join('\n');

    const systemPrompt = `You are a concise financial analyst writing for a college-level audience. Given quarterly earnings data, write a 3-4 paragraph plain-English analysis covering:
1. Revenue trajectory and growth trends
2. Profitability (margins, EPS trends)
3. Notable patterns or inflection points
4. Brief forward-looking commentary based on trends

Use specific numbers from the data. Keep it under 250 words. Do not use bullet points. Write in a professional but accessible tone.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the recent quarterly earnings for ${companyName} (${ticker}):\n\n${dataStr}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit reached. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error [${response.status}]`);
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content ?? 'Unable to generate summary.';

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-earnings-summary:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
