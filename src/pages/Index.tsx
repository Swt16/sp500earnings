import { useState } from "react";
import { companies, allQuarters } from "@/data/earningsData";
import EarningsTable from "@/components/EarningsTable";
import EarningsChart from "@/components/EarningsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");

  const company = companies.find((c) => c.ticker === selectedTicker)!;
  const quarterFilter = selectedQuarter === "all" ? null : selectedQuarter;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono font-bold text-primary tracking-tight">
              EARNINGS TERMINAL
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Mag 7 Quarterly Data · 2021–2025
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono text-muted-foreground">LIVE</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Company
            </label>
            <Select value={selectedTicker} onValueChange={setSelectedTicker}>
              <SelectTrigger className="w-[220px] font-mono bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {companies.map((c) => (
                  <SelectItem key={c.ticker} value={c.ticker} className="font-mono">
                    {c.ticker} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Quarter
            </label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[180px] font-mono bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[300px]">
                <SelectItem value="all" className="font-mono">
                  All Quarters
                </SelectItem>
                {allQuarters.map((q) => (
                  <SelectItem key={q} value={q} className="font-mono">
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-foreground">
                {company.ticker}
              </p>
              <p className="text-sm text-muted-foreground">{company.name}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Trend Analysis
          </h2>
          <EarningsChart data={company.data} companyName={company.name} />
        </div>

        {/* Table */}
        <div>
          <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
            Financial Data
          </h2>
          <EarningsTable data={company.data} selectedQuarter={quarterFilter} />
        </div>

        {/* Transcript Summary */}
        {quarterFilter ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
              Earnings Call Summary — {quarterFilter}
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {company.data.find((d) => d.quarter === quarterFilter)?.summary}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
              Recent Earnings Call Summaries
            </h2>
            <div className="space-y-3">
              {company.data
                .slice(-4)
                .reverse()
                .map((entry) => (
                  <div key={entry.quarter} className="border-l-2 border-primary/30 pl-4">
                    <p className="text-xs font-mono text-primary mb-1">{entry.quarter}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
