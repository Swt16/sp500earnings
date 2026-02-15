const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-mono font-bold text-primary tracking-tight hover:underline">
            EARNINGS TERMINAL
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-3xl font-mono font-bold text-foreground">About This Project</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">What It Does</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Earnings Terminal is an interactive dashboard for exploring quarterly financial data across S&P 500 companies. It visualizes revenue, EPS, net income, capital expenditure, margins, and stock price trends — all in one place.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">Data Sources</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-foreground">Mag 7 companies</strong> — Hardcoded historical data covering 2021–2025 for immediate access without API calls.
            </li>
            <li>
              <strong className="text-foreground">All other S&P 500 companies</strong> — Live data fetched from the Alpha Vantage API on demand.
            </li>
            <li>
              <strong className="text-foreground">Stock prices</strong> — Monthly adjusted close prices, also from Alpha Vantage.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">Caching</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To stay within Alpha Vantage's rate limits, fetched data is cached in the backend for 24 hours. Subsequent requests for the same company serve cached data instantly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">AI Analysis</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The "AI Earnings Analysis" feature sends the most recent quarters of financial data to an AI model, which generates a plain-English summary of trends. It does <strong className="text-foreground">not</strong> pull from earnings call transcripts, news, or investor relations websites — the analysis is based solely on the numerical data shown in the dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">Tech Stack</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1.5">
            <li>React + TypeScript + Vite</li>
            <li>Tailwind CSS + shadcn/ui</li>
            <li>Recharts for data visualization</li>
            <li>Lovable Cloud for backend functions, caching, and AI</li>
          </ul>
        </section>

        <div className="pt-4 border-t border-border">
          <a href="/" className="text-sm font-mono text-primary hover:underline">
            ← Back to Terminal
          </a>
        </div>
      </main>
    </div>
  );
};

export default About;
