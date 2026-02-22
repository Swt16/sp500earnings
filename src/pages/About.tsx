import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-mono font-bold text-primary tracking-tight hover:underline">
            {t("app.title")}
          </a>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-3xl font-mono font-bold text-foreground">{t("about.title")}</h1>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.whatTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about.whatDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.dataTitle")}</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-foreground">{t("about.dataCompanies")}</strong> — {t("about.dataCompaniesDesc")}
            </li>
            <li>
              <strong className="text-foreground">{t("about.dataPrice")}</strong> — {t("about.dataPriceDesc")}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.cacheTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about.cacheDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.aiTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about.aiDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.insightsTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about.insightsDesc")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-mono font-semibold text-primary">{t("about.techTitle")}</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1.5">
            <li>React + TypeScript + Vite</li>
            <li>Tailwind CSS + shadcn/ui</li>
            <li>Recharts for data visualization</li>
            <li>Lovable Cloud for backend functions, caching, and AI</li>
          </ul>
        </section>

        <div className="pt-4 border-t border-border">
          <a href="/" className="text-sm font-mono text-primary hover:underline">
            {t("about.backLink")}
          </a>
        </div>
      </main>
    </div>
  );
};

export default About;
