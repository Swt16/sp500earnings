import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { EarningsEntry } from "@/data/earningsData";

interface CsvExportProps {
  data: EarningsEntry[];
  ticker: string;
}

const CsvExport = ({ data, ticker }: CsvExportProps) => {
  const exportCsv = () => {
    const headers = ["Quarter", "Revenue ($B)", "EPS ($)", "Net Income ($B)", "CapEx ($B)", "Gross Margin (%)", "Operating Margin (%)"];
    const rows = [...data].reverse().map((d) => [
      d.quarter,
      d.revenue.toFixed(2),
      d.eps.toFixed(2),
      d.netIncome.toFixed(2),
      (d.capex ?? 0).toFixed(2),
      (d.grossMargin ?? 0).toFixed(1),
      (d.operatingMargin ?? 0).toFixed(1),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticker}_earnings.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={exportCsv}
      variant="outline"
      size="sm"
      className="font-mono text-xs gap-1.5"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );
};

export default CsvExport;
