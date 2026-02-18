import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { EarningsEntry } from "@/data/earningsData";
import { useLanguage } from "@/contexts/LanguageContext";

const HeaderWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 cursor-help">
        {label}
        <Info className="h-3 w-3 text-muted-foreground" />
      </span>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[250px] text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

interface EarningsTableProps {
  data: EarningsEntry[];
  selectedQuarter: string | null;
}

const fmt = (val: number, prefix = "$") => `${prefix}${val.toFixed(2)}B`;
const fmtEps = (val: number) => `$${val.toFixed(2)}`;

const EarningsTable = ({ data, selectedQuarter }: EarningsTableProps) => {
  const { t } = useLanguage();
  const filtered = selectedQuarter
    ? data.filter((d) => d.quarter === selectedQuarter)
    : [...data].reverse();

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="font-mono text-xs text-primary">{t("table.quarter")}</TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.revenue")} tooltip={t("glossary.revenue")} /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.eps")} tooltip={t("glossary.eps")} /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.netIncome")} tooltip={t("glossary.netIncome")} /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.capex")} tooltip={t("glossary.capex")} /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.grossMargin")} tooltip={t("glossary.grossMargin")} /></TableHead>
            <TableHead className="font-mono text-xs text-primary text-right"><HeaderWithTooltip label={t("table.opMargin")} tooltip={t("glossary.opMargin")} /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((entry) => (
            <TableRow key={entry.quarter} className="hover:bg-secondary/30 transition-colors">
              <TableCell className="font-mono text-sm text-foreground">{entry.quarter}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{fmt(entry.revenue)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">{fmtEps(entry.eps)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-foreground">
                <span className={entry.netIncome < 0 ? "text-destructive" : ""}>{fmt(entry.netIncome)}</span>
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
