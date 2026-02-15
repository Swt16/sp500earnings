import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { EarningsEntry } from "@/data/earningsData";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarginChartProps {
  data: EarningsEntry[];
  companyName: string;
}

const MarginChart = ({ data, companyName }: MarginChartProps) => {
  const isMobile = useIsMobile();

  const chartData = data.map((d) => ({
    quarter: d.quarter,
    grossMargin: d.grossMargin ?? 0,
    operatingMargin: d.operatingMargin ?? 0,
  }));

  // Don't render if no margin data
  if (chartData.every((d) => d.grossMargin === 0 && d.operatingMargin === 0)) {
    return (
      <p className="text-sm text-muted-foreground font-mono py-8 text-center">
        No margin data available
      </p>
    );
  }

  return (
    <div className={`${isMobile ? "h-[280px]" : "h-[350px]"} w-full`}>
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: "hsl(160, 100%, 45%)" }} />
          <span className="text-xs font-mono text-muted-foreground">Gross Margin %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: "hsl(45, 100%, 55%)" }} />
          <span className="text-xs font-mono text-muted-foreground">Operating Margin %</span>
        </div>
      </div>
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
            width={isMobile ? 40 : 50}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
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
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === "grossMargin" ? "Gross Margin" : "Operating Margin",
            ]}
          />
          <Line
            type="monotone"
            dataKey="grossMargin"
            stroke="hsl(160, 100%, 45%)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(160, 100%, 45%)" }}
            activeDot={{ r: 5 }}
            name="grossMargin"
          />
          <Line
            type="monotone"
            dataKey="operatingMargin"
            stroke="hsl(45, 100%, 55%)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(45, 100%, 55%)" }}
            activeDot={{ r: 5 }}
            name="operatingMargin"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarginChart;
