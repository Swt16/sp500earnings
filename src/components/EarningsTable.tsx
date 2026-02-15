import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EarningsEntry } from "@/data/earningsData";

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
            <TableHead className="font-mono text-xs text-primary text-right">Revenue</TableHead>
            <TableHead className="font-mono text-xs text-primary text-right">EPS</TableHead>
            <TableHead className="font-mono text-xs text-primary text-right">Net Income</TableHead>
            
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
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EarningsTable;
