const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { ticker, companyName, language } = await req.json();

    if (!ticker || typeof ticker !== 'string' || !/^[A-Z]{1,5}$/i.test(ticker)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ticker format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!companyName || typeof companyName !== 'string' || companyName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid companyName parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const langInstruction = language === 'zh'
      ? 'Write the entire response in Simplified Chinese (简体中文).'
      : 'Write the response in English.';

    const systemPrompt = `You are a knowledgeable financial analyst. Based on your training knowledge, provide insights about the most recent earnings call for ${companyName} (${ticker}). Cover:

1. **Key Management Commentary** — What did the CEO/CFO highlight? Any strategic shifts, guidance updates, or notable quotes?
2. **Surprises & Beats/Misses** — Did the company beat or miss analyst expectations? Any unexpected announcements?
3. **Forward Guidance** — What outlook did management provide for the next quarter/year?
4. **Analyst Sentiment** — What were the key questions or concerns raised by analysts on the call?
5. **Strategic Initiatives** — Any new products, partnerships, acquisitions, or restructuring mentioned?

Keep it concise (200-300 words), use a professional tone, and note that insights are based on AI knowledge which may not reflect the very latest call. ${langInstruction}`;

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
          { role: 'user', content: `Provide earnings call insights for ${companyName} (${ticker}). Share what you know about their most recent earnings call highlights, management commentary, and analyst reactions.` },
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
    const insights = result.choices?.[0]?.message?.content ?? 'Unable to generate insights.';

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-earnings-call-insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
