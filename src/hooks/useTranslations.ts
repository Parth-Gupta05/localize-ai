import { useContext } from "react";
import LanguageContext from "../context/LanguageContext.js";

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used within LanguageContextProvider");
  }

  const { lang, translations, setLang, supportedLangs } = context;

  function t(key: string): string {
    const entry = translations[key];

    if (!entry) return key;

    return entry;
  }

  return { t, setLang, lang, supportedLangs };
}