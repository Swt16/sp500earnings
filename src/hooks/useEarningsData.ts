import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EarningsEntry } from "@/data/earningsData";
import { companies as fallbackCompanies } from "@/data/earningsData";
import { sp500Companies } from "@/data/sp500Companies";

export type { SP500Company } from "@/data/sp500Companies";
export { sp500Companies };

export interface MonthlyPrice {
  date: string;
  close: number;
  volume: number;
}

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
    placeholderData: () => {
      const fallback = fallbackCompanies.find((c) => c.ticker === ticker);
      return fallback?.data;
    },
  });
}

export function useMonthlyPrices(ticker: string) {
  return useQuery<MonthlyPrice[]>({
    queryKey: ["monthly_prices", ticker],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-earnings", {
        body: { action: "monthly_prices", ticker },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.data || data.data.length === 0) {
        throw new Error("No price data returned");
      }
      return data.data;
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
}
