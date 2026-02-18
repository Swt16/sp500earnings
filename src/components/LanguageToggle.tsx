import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-xs font-mono text-muted-foreground"
      aria-label="Toggle language"
    >
      {language === "en" ? "中文" : "EN"}
    </button>
  );
};

export default LanguageToggle;
