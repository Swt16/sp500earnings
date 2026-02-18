import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EarningsEntry } from "@/data/earningsData";
import { useLanguage } from "@/contexts/LanguageContext";

interface EarningsChartProps {
  data: EarningsEntry[];
  companyName: string;
}

type MetricKey = "revenue" | "eps" | "netIncome" | "capex";

const EarningsChart = ({ data, companyName }: EarningsChartProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(["revenue"])
  );

  const metrics: { key: MetricKey; label: string; color: string }[] = [
    { key: "revenue", label: t("metric.revenue"), color: "hsl(160, 100%, 45%)" },
    { key: "eps", label: t("metric.eps"), color: "hsl(200, 90%, 50%)" },
    { key: "netIncome", label: t("metric.netIncome"), color: "hsl(45, 100%, 55%)" },
    { key: "capex", label: t("metric.capex"), color: "hsl(280, 80%, 60%)" },
  ];

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const chartData = data.map((d) => ({
    quarter: d.quarter,
    revenue: d.revenue,
    eps: d.eps,
    netIncome: d.netIncome,
    capex: d.capex ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
              activeMetrics.has(m.key)
                ? "border-primary/50 bg-secondary text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
            style={
              activeMetrics.has(m.key)
                ? { borderColor: m.color, color: m.color }
                : undefined
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={`${isMobile ? 'h-[280px]' : 'h-[350px]'} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? 0 : 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="quarter"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11, fontFamily: "JetBrains Mono" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              angle={-45}
              textAnchor="end"
              height={isMobile ? 50 : 60}
              interval={isMobile ? 3 : 1}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11, fontFamily: "JetBrains Mono" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={isMobile ? 40 : 55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--primary))", fontWeight: 600 }}
            />
            {metrics
              .filter((m) => activeMetrics.has(m.key))
              .map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: m.color }}
                  activeDot={{ r: 5, fill: m.color }}
                  name={m.label}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EarningsChart;
