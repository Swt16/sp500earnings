import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface EarningsCallInsightsProps {
  ticker: string;
  companyName: string;
}

const EarningsCallInsights = ({ ticker, companyName }: EarningsCallInsightsProps) => {
  const { t, language } = useLanguage();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTicker, setLastTicker] = useState<string | null>(null);

  const generate = async () => {
    setIsLoading(true);
    setInsights(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-earnings-call-insights", {
        body: { ticker, companyName, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights);
      setLastTicker(ticker);
    } catch (e: any) {
      console.error("Earnings call insights error:", e);
      toast.error(e.message || "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  const needsRefresh = lastTicker !== ticker;

  return (
    <div className="space-y-3">
      {(!insights || needsRefresh) && !isLoading && (
        <Button onClick={generate} variant="outline" className="font-mono text-xs gap-2">
          <MessageSquareText className="h-3.5 w-3.5" />
          {t("insights.generate")}
        </Button>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      )}

      {insights && !needsRefresh && (
        <div className="space-y-3">
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {insights}
          </div>
          <p className="text-xs text-muted-foreground italic">
            {t("insights.disclaimer")}
          </p>
          <Button onClick={generate} variant="ghost" size="sm" className="font-mono text-xs gap-1.5 text-muted-foreground">
            <MessageSquareText className="h-3 w-3" />
            {t("ai.regenerate")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EarningsCallInsights;
