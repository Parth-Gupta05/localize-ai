import { useContext } from "react";
import LanguageContext from "../context/LanguageContext.js";

// 🔥 SAME NORMALIZER (IMPORTANT — MUST MATCH EXTRACTOR)
function normalize(text: string): string {
  return text
    .trim()
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useTranslation must be used within LanguageContextProvider"
    );
  }

  const { lang, translations, setLang, supportedLangs } = context;

  function interpolate(
    text: string,
    vars?: Record<string, any>
  ): string {
    if (!vars) return text;

    return text.replace(/{{(.*?)}}/g, (_, key) => {
      const value = vars[key.trim()];

      if (value === undefined) {
        console.warn(`⚠️ Missing variable: ${key}`);
        return `{{${key}}}`;
      }

      return String(value);
    });
  }

  function t(key: string, vars?: Record<string, any>): string {
    const normalizedKey = normalize(key);

    const baseText =
      translations[normalizedKey] ||
      translations[key] ||
      key;

    return interpolate(baseText, vars);
  }

  return { t, setLang, lang, supportedLangs };
}