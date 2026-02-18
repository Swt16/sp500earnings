import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import type { EarningsEntry } from "@/data/earningsData";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface AISummaryProps {
  ticker: string;
  companyName: string;
  earningsData: EarningsEntry[];
}

const AISummary = ({ ticker, companyName, earningsData }: AISummaryProps) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTicker, setLastTicker] = useState<string | null>(null);

  const generate = async () => {
    setIsLoading(true);
    setSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-earnings-summary", {
        body: { ticker, companyName, earningsData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary);
      setLastTicker(ticker);
    } catch (e: any) {
      console.error("AI summary error:", e);
      toast.error(e.message || "Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  const needsRefresh = lastTicker !== ticker;

  return (
    <div className="space-y-3">
      {(!summary || needsRefresh) && !isLoading && (
        <Button onClick={generate} variant="outline" className="font-mono text-xs gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          {t("ai.generate")}
        </Button>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      )}

      {summary && !needsRefresh && (
        <div className="space-y-3">
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {summary}
          </div>
          <Button onClick={generate} variant="ghost" size="sm" className="font-mono text-xs gap-1.5 text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {t("ai.regenerate")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AISummary;
