import { useState, useCallback } from "react";
import { allQuarters } from "@/data/earningsData";
import { sp500Companies } from "@/data/sp500Companies";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyEarnings } from "@/hooks/useEarningsData";
import ThemeToggle from "@/components/ThemeToggle";
import EarningsTable from "@/components/EarningsTable";
import EarningsChart from "@/components/EarningsChart";
import MarginChart from "@/components/MarginChart";
import StockPriceChart from "@/components/StockPriceChart";
import CompanySearch from "@/components/CompanySearch";
import AISummary from "@/components/AISummary";
import CsvExport from "@/components/CsvExport";
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

  const selectRandom = useCallback(() => {
    const pool = sectorFilter === "all" ? sp500Companies : sp500Companies.filter((c) => c.sector === sectorFilter);
    const random = pool[Math.floor(Math.random() * pool.length)];
    if (random) setSelectedTicker(random.ticker);
  }, [sectorFilter]);

  const { data: earningsData, monthlyPrices: priceData, isLoading: earningsLoading, isError } = useCompanyEarnings(selectedTicker);
  const priceLoading = earningsLoading;

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
          <div className="flex items-center gap-3">
            <a href="/about" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="/share" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              Share
            </a>
            <ThemeToggle />
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
            <CompanySearch
              companies={filteredCompanies}
              value={selectedTicker}
              onSelect={setSelectedTicker}
            />
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

          <Button variant="outline" size="sm" onClick={selectRandom} className="font-mono">
            <Shuffle className="h-4 w-4 mr-1" />
            Random
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold text-foreground">
                {selectedTicker}
              </p>
              <a
                href={`https://finance.yahoo.com/quote/${selectedTicker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {selectedCompany?.name ?? selectedTicker} ↗
              </a>
              {selectedCompany?.sector && (
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {selectedCompany.sector}
                </p>
              )}
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
            Failed to load earnings data for {selectedTicker}. The daily API request limit may have been reached. Try again tomorrow or select a previously loaded company.
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

            {/* Margin Trends */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                Margin Trends
              </h2>
              <MarginChart data={earningsData} companyName={selectedCompany?.name ?? selectedTicker} />
            </div>

            {/* Stock Price Chart */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-4">
                Monthly Stock Price
              </h2>
              <StockPriceChart data={priceData} isLoading={priceLoading} companyName={selectedCompany?.name ?? selectedTicker} />
            </div>

            {/* Table with Export */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                  Financial Data
                </h2>
                <CsvExport data={earningsData} ticker={selectedTicker} />
              </div>
              <EarningsTable data={earningsData} selectedQuarter={quarterFilter} />
            </div>

            {/* AI Summary */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-3">
                AI Earnings Analysis
              </h2>
              <AISummary
                ticker={selectedTicker}
                companyName={selectedCompany?.name ?? selectedTicker}
                earningsData={earningsData}
              />
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
