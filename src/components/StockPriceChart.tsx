import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyPrice } from "@/hooks/useEarningsData";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface StockPriceChartProps {
  data: MonthlyPrice[] | undefined;
  isLoading: boolean;
  companyName: string;
}

const formatVolume = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return `${v}`;
};

const StockPriceChart = ({ data, isLoading, companyName }: StockPriceChartProps) => {
  const isMobile = useIsMobile();
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-lg" />;
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-mono py-8 text-center">
        No price data available
      </p>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(0, 7),
    close: d.close,
    volume: d.volume,
  }));

  const minPrice = Math.floor(Math.min(...chartData.map((d) => d.close)) * 0.95);
  const maxPrice = Math.ceil(Math.max(...chartData.map((d) => d.close)) * 1.05);

  return (
    <div className={`${isMobile ? 'h-[280px]' : 'h-[350px]'} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: isMobile ? 10 : 60, left: isMobile ? 0 : 10, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 100%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 100%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11, fontFamily: "JetBrains Mono" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            angle={-45}
            textAnchor="end"
            height={isMobile ? 50 : 60}
            interval={isMobile ? 11 : 5}
          />
          <YAxis
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11, fontFamily: "JetBrains Mono" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            width={isMobile ? 45 : 65}
            tickFormatter={(v) => `$${v}`}
          />
          {!isMobile && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={50}
              tickFormatter={formatVolume}
            />
          )}
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
            formatter={(value: number, name: string) =>
              name === "close"
                ? [`$${value.toFixed(2)}`, "Close"]
                : [formatVolume(value), "Volume"]
            }
          />
          {!isMobile && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="hsl(200, 90%, 50%)"
              opacity={0.2}
              barSize={6}
            />
          )}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="hsl(160, 100%, 45%)"
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockPriceChart;
