import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";

interface CompanyOption {
  ticker: string;
  name: string;
}

interface CompanySearchProps {
  companies: CompanyOption[];
  value: string;
  onSelect: (ticker: string) => void;
}

const CompanySearch = ({ companies, value, onSelect }: CompanySearchProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected = companies.find((c) => c.ticker === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="w-[280px] flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card font-mono text-sm text-foreground hover:bg-secondary/50 transition-colors"
        >
          <span className="truncate">
            {selected ? `${selected.ticker} — ${selected.name}` : t("search.select")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-popover border-border z-50" align="start">
        <Command>
          <CommandInput
            placeholder={t("search.placeholder")}
            className="font-mono text-sm"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground font-mono">
              {t("search.empty")}
            </CommandEmpty>
            <CommandGroup>
              {companies.map((c) => (
                <CommandItem
                  key={c.ticker}
                  value={`${c.ticker} ${c.name}`}
                  onSelect={() => {
                    onSelect(c.ticker);
                    setOpen(false);
                  }}
                  className="font-mono text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === c.ticker ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.ticker} — {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CompanySearch;
