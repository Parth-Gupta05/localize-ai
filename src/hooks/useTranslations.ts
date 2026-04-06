import { useContext, useEffect, useState } from "react";
import LanguageContext from "../context/LanguageContext.js";

function normalize(text: string): string {
  return text.trim();
}

export function useTranslation(namespace: string = "common") {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useTranslation must be used within LanguageContextProvider",
    );
  }

  const { lang, setLang, supportedLangs, cache } = context;

  const [translations, setTranslations] = useState<Record<string, string>>({});

  // 🔥 Load namespace dynamically
  useEffect(() => {
    if (!lang) return;

    async function loadNamespace() {
      // ✅ check cache first
      if (cache[lang]?.[namespace]) {
        setTranslations(cache[lang][namespace]);
        return;
      }

      try {
        const res = await fetch(`/locales/${lang}/${namespace}.json`);

        if (!res.ok) throw new Error("Missing namespace file");

        const data = await res.json();

        // 🔥 init cache
        if (!cache[lang]) cache[lang] = {};
        cache[lang][namespace] = data;

        setTranslations(data);
      } catch (err) {
        console.warn(`⚠️ Missing ${namespace} for ${lang}, falling back`);

        // fallback → empty (t will return key)
        setTranslations({});
      }
    }

    loadNamespace();
  }, [lang, namespace]);

  // 🔥 interpolation
  function interpolate(text: string, vars?: Record<string, any>): string {
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

  // 🔥 translation function
  function t(key: string, vars?: Record<string, any>): string {
    const normalizedKey = normalize(key);

    const baseText = translations[normalizedKey] || translations[key] || key;

    return interpolate(baseText, vars);
  }

  return { t, setLang, lang, supportedLangs };
}
