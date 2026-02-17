import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { EarningsEntry } from "@/data/earningsData";

const glossary: Record<string, string> = {
  Revenue: "Total income generated from sales before any expenses are deducted.",
  EPS: "Earnings Per Share — net profit divided by the number of outstanding shares.",
  "Net Income": "Total profit after all expenses, taxes, and costs have been subtracted from revenue.",
  CapEx: "Capital Expenditure — funds used to acquire or upgrade physical assets like equipment or buildings.",
  "Gross Margin": "Percentage of revenue remaining after deducting the cost of goods sold.",
  "Op. Margin": "Operating Margin — percentage of revenue remaining after deducting operating expenses.",
};

const HeaderWithTooltip = ({ label }: { label: string }) => {
  const definition = glossary[label];
  if (!definition) return <span>{label}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {label}
          <Info className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-xs">
        {definition}
      </TooltipContent>
    </Tooltip>
  );
};

interface EarningsTableProps {
  data: EarningsEntry[];
  selectedQuarter: string | null;
}

const fmt = (val: number, prefix = "$") =>
  `${prefix}${val.toFixed(2)}B`;

const fmtEps = (val: number) => `$${val.toFixed(2)}`;

const EarningsTable = ({ data, selectedQuarter }: EarningsTableProps) => {
  const filtered = selectedQuarter
    ? data.filter((d) => d.quarter === selectedQuarter)
    : [...data].reverse();

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="font-mono text-xs text-primary">Quarter</TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="Revenue" /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="EPS" /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="Net Income" /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="CapEx" /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="Gross Margin" /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label="Op. Margin" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((entry) => (
            <TableRow
              key={entry.quarter}
              className="hover:bg-secondary/30 transition-colors"
            >
              <TableCell className="font-mono text-sm text-foreground">{entry.quarter}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{fmt(entry.revenue)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{fmtEps(entry.eps)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">
                <span className={entry.netIncome < 0 ? "text-destructive" : ""}>
                  {fmt(entry.netIncome)}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{fmt(entry.capex ?? 0)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{(entry.grossMargin ?? 0).toFixed(1)}%</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{(entry.operatingMargin ?? 0).toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EarningsTable;
