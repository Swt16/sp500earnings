import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "zh";

const translations = {
  // Header
  "app.title": { en: "EARNINGS TERMINAL", zh: "财报终端" },
  "app.subtitle": { en: "S&P 500 Quarterly Data · Live", zh: "标普500季度数据 · 实时" },
  "nav.about": { en: "About", zh: "关于" },
  "nav.share": { en: "Share", zh: "分享" },

  // Controls
  "label.sector": { en: "Sector", zh: "行业" },
  "label.company": { en: "Company", zh: "公司" },
  "label.quarter": { en: "Quarter", zh: "季度" },
  "btn.random": { en: "Random", zh: "随机" },
  "select.allSectors": { en: "All Sectors", zh: "全部行业" },
  "select.allQuarters": { en: "All Quarters", zh: "全部季度" },
  "search.placeholder": { en: "Search ticker or name...", zh: "搜索代码或名称..." },
  "search.empty": { en: "No company found.", zh: "未找到公司。" },
  "search.select": { en: "Select company...", zh: "选择公司..." },

  // Chart sections
  "section.trendAnalysis": { en: "Trend Analysis", zh: "趋势分析" },
  "section.marginTrends": { en: "Margin Trends", zh: "利润率趋势" },
  "section.stockPrice": { en: "Monthly Stock Price", zh: "月度股价" },
  "section.financialData": { en: "Financial Data", zh: "财务数据" },
  "section.aiAnalysis": { en: "AI Earnings Analysis", zh: "AI 财报分析" },
  "section.earningsCallInsights": { en: "Latest Earnings Call Insights", zh: "最新财报电话会议洞察" },
  "section.quarterSummary": { en: "Quarter Summary", zh: "季度摘要" },
  "section.recentSummaries": { en: "Recent Quarter Summaries", zh: "近期季度摘要" },

  // Chart metrics
  "metric.revenue": { en: "Revenue ($B)", zh: "营收（十亿美元）" },
  "metric.eps": { en: "EPS ($)", zh: "每股收益（美元）" },
  "metric.netIncome": { en: "Net Income ($B)", zh: "净利润（十亿美元）" },
  "metric.capex": { en: "CapEx ($B)", zh: "资本支出（十亿美元）" },
  "metric.grossMargin": { en: "Gross Margin %", zh: "毛利率 %" },
  "metric.operatingMargin": { en: "Operating Margin %", zh: "营业利润率 %" },
  "metric.grossMarginShort": { en: "Gross Margin", zh: "毛利率" },
  "metric.operatingMarginShort": { en: "Operating Margin", zh: "营业利润率" },
  "chart.close": { en: "Close", zh: "收盘价" },
  "chart.volume": { en: "Volume", zh: "成交量" },
  "chart.noMarginData": { en: "No margin data available", zh: "暂无利润率数据" },
  "chart.noPriceData": { en: "No price data available", zh: "暂无股价数据" },

  // Table headers
  "table.quarter": { en: "Quarter", zh: "季度" },
  "table.revenue": { en: "Revenue", zh: "营收" },
  "table.eps": { en: "EPS", zh: "每股收益" },
  "table.netIncome": { en: "Net Income", zh: "净利润" },
  "table.capex": { en: "CapEx", zh: "资本支出" },
  "table.grossMargin": { en: "Gross Margin", zh: "毛利率" },
  "table.opMargin": { en: "Op. Margin", zh: "营业利润率" },

  // Glossary
  "glossary.revenue": { en: "Total income generated from sales before any expenses are deducted.", zh: "扣除任何费用前的销售总收入。" },
  "glossary.eps": { en: "Earnings Per Share — net profit divided by the number of outstanding shares.", zh: "每股收益——净利润除以流通在外的股份数。" },
  "glossary.netIncome": { en: "Total profit after all expenses, taxes, and costs have been subtracted from revenue.", zh: "从收入中扣除所有费用、税收和成本后的总利润。" },
  "glossary.capex": { en: "Capital Expenditure — funds used to acquire or upgrade physical assets like equipment or buildings.", zh: "资本支出——用于购置或升级设备、建筑物等实物资产的资金。" },
  "glossary.grossMargin": { en: "Percentage of revenue remaining after deducting the cost of goods sold.", zh: "扣除销售成本后的收入百分比。" },
  "glossary.opMargin": { en: "Operating Margin — percentage of revenue remaining after deducting operating expenses.", zh: "营业利润率——扣除营业费用后的收入百分比。" },

  // AI Summary
  "ai.generate": { en: "Generate AI Analysis", zh: "生成 AI 分析" },
  "ai.regenerate": { en: "Regenerate", zh: "重新生成" },
  "insights.generate": { en: "Generate Earnings Call Insights", zh: "生成财报电话会议洞察" },
  "insights.disclaimer": { en: "Based on AI knowledge — may not reflect the very latest earnings call.", zh: "基于 AI 知识——可能不反映最新的财报电话会议。" },

  // CSV Export
  "export.csv": { en: "Export CSV", zh: "导出 CSV" },

  // Loading / Error
  "error.loadFailed": { en: "Failed to load earnings data for", zh: "加载财报数据失败：" },
  "error.apiLimit": { en: "The daily API request limit may have been reached. Try again tomorrow or select a previously loaded company.", zh: "每日 API 请求限制可能已达上限。请明天再试或选择已加载的公司。" },

  // About page
  "about.title": { en: "About This Project", zh: "关于本项目" },
  "about.whatTitle": { en: "What It Does", zh: "功能介绍" },
  "about.whatDesc": { en: "Earnings Terminal is an interactive dashboard for exploring quarterly financial data across S&P 500 companies. It visualizes revenue, EPS, net income, capital expenditure, margins, and stock price trends — all in one place.", zh: "财报终端是一个互动仪表盘，可浏览标普500公司的季度财务数据。集营收、每股收益、净利润、资本支出、利润率和股价趋势于一体。" },
  "about.dataTitle": { en: "Data Sources", zh: "数据来源" },
  "about.dataCompanies": { en: "S&P 500 companies", zh: "标普500公司" },
  "about.dataCompaniesDesc": { en: "Live data fetched from the Alpha Vantage API on demand.", zh: "通过 Alpha Vantage API 实时按需获取数据。" },
  "about.dataPrice": { en: "Stock prices", zh: "股票价格" },
  "about.dataPriceDesc": { en: "Monthly adjusted close prices, also from Alpha Vantage.", zh: "月度调整后收盘价，同样来自 Alpha Vantage。" },
  "about.cacheTitle": { en: "Caching", zh: "缓存" },
  "about.cacheDesc": { en: "To stay within Alpha Vantage's rate limits, fetched data is cached in the backend for 7 days. Subsequent requests for the same company serve cached data instantly.", zh: "为遵守 Alpha Vantage 的速率限制，获取的数据在后端缓存7天。对同一公司的后续请求将立即返回缓存数据。" },
  "about.aiTitle": { en: "AI Analysis", zh: "AI 分析" },
  "about.aiDesc": { en: 'The "AI Earnings Analysis" feature sends the most recent quarters of financial data to an AI model, which generates a plain-English summary of trends. It does not pull from earnings call transcripts, news, or investor relations websites — the analysis is based solely on the numerical data shown in the dashboard.', zh: '"AI 财报分析"功能将最近几个季度的财务数据发送给 AI 模型，生成趋势的中文摘要。该功能不会从财报电话会议记录、新闻或投资者关系网站获取信息——分析完全基于仪表盘中显示的数值数据。' },
  "about.techTitle": { en: "Tech Stack", zh: "技术栈" },
  "about.backLink": { en: "← Back to Terminal", zh: "← 返回终端" },

  // Share page
  "share.title": { en: "Share", zh: "分享" },
  "share.scanDesc": { en: "Scan the QR code below to open Earnings Terminal on any device.", zh: "扫描下方二维码，在任意设备上打开财报终端。" },
  "share.backLink": { en: "← Back to Terminal", zh: "← 返回终端" },

  // 404 page
  "notFound.title": { en: "404", zh: "404" },
  "notFound.message": { en: "Oops! Page not found", zh: "糟糕！页面未找到" },
  "notFound.link": { en: "Return to Home", zh: "返回首页" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as Language) || "en";
    }
    return "en";
  });

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem("language", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[language] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
