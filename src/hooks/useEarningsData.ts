import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EarningsEntry } from "@/data/earningsData";
import { companies as fallbackCompanies } from "@/data/earningsData";
import { sp500Companies } from "@/data/sp500Companies";

export type { SP500Company } from "@/data/sp500Companies";
export { sp500Companies };

export function useCompanyEarnings(ticker: string) {
  return useQuery<EarningsEntry[]>({
    queryKey: ["earnings", ticker],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-earnings", {
        body: { action: "earnings", ticker },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.data || data.data.length === 0) {
        throw new Error("No data returned");
      }
      return data.data;
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
    // Fall back to hardcoded Mag 7 data if API fails
    placeholderData: () => {
      const fallback = fallbackCompanies.find((c) => c.ticker === ticker);
      return fallback?.data;
    },
  });
}
