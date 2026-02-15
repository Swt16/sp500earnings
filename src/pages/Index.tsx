import { useState } from "react";
import { allQuarters } from "@/data/earningsData";
import { sp500Companies } from "@/data/sp500Companies";
import { useCompanyEarnings } from "@/hooks/useEarningsData";
import EarningsTable from "@/components/EarningsTable";
import EarningsChart from "@/components/EarningsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const sectors = Array.from(new Set(sp500Companies.map((c) => c.sector))).sort();

const Index = () => {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const { data: earningsData, isLoading: earningsLoading, isError } = useCompanyEarnings(selectedTicker);

  const filteredCompanies = sectorFilter === "all"
    ? sp500Companies
    : sp500Companies.filter((c) => c.sector === sectorFilter);

  const selectedCompany = sp500Companies.find((c) => c.ticker === selectedTicker);
  const quarterFilter = selectedQuarter === "all" ? null : selectedQuarter;
  const availableQuarters = earningsData?.map((d) => d.quarter) ?? allQuarters;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono font-bold text-primary tracking-tight">
              EARNINGS TERMINAL
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              S&P 500 Quarterly Data · Live
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs font-mono text-muted-foreground">
              {sp500Companies.length} COMPANIES
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Sector
            </label>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[200px] font-mono bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[300px]">
                <SelectItem value="all" className="font-mono">All Sectors</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s} className="font-mono">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Company
            </label>
            <Select value={selectedTicker} onValueChange={setSelectedTicker}>
              <SelectTrigger className="w-[280px] font-mono bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[300px]">
                {filteredCompanies.map((c) => (
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
                <SelectItem value="all" className="font-mono">All Quarters</SelectItem>
                {availableQuarters.map((q) => (
                  <SelectItem key={q} value={q} className="font-mono">{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-foreground">
                {selectedTicker}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCompany?.name ?? selectedTicker}
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {earningsLoading && !earningsData && (
          <div className="space-y-4">
            <Skeleton className="h-[350px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        )}

        {/* Error state */}
        {isError && !earningsData && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-5 text-sm text-destructive font-mono">
            Failed to load earnings data for {selectedTicker}. The FMP free tier only returns the 5 most recent quarters. Mag 7 companies have full hardcoded data as fallback.
          </div>
        )}

        {earningsData && (
          <>
            {/* Chart */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                Trend Analysis
              </h2>
              <EarningsChart data={earningsData} companyName={selectedCompany?.name ?? selectedTicker} />
            </div>

            {/* Table */}
            <div>
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
                Financial Data
              </h2>
              <EarningsTable data={earningsData} selectedQuarter={quarterFilter} />
            </div>

            {/* Summary */}
            {quarterFilter ? (
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
                  Quarter Summary — {quarterFilter}
                </h2>
                <p className="text-sm text-foreground leading-relaxed">
                  {earningsData.find((d) => d.quarter === quarterFilter)?.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
                  Recent Quarter Summaries
                </h2>
                <div className="space-y-3">
                  {earningsData
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
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
