import { useEffect, useRef, useState } from "react";
import LanguageContext from "./LanguageContext.js";

function LanguageContextProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>("en");
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);

  const cache = useRef<Record<string, Record<string, string>>>({});

  // 🔹 Load runtime config ONCE
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/localize.runtime.json");
        const config = await res.json();

        setSupportedLangs(config.supportedLangs || []);

        // set initial language safely
        const initialLang = config.supportedLangs?.includes(
          config.sourceLanguage,
        )
          ? config.sourceLanguage
          : "en";

        setLang(initialLang);
      } catch (err) {
        console.warn("⚠️ Failed to load runtime config", err);
      } finally {
        setIsReady(true);
      }
    }

    loadConfig();
  }, []);

  // 🔹 Load translations WHEN lang changes
  useEffect(() => {
    if (!lang) return;

    if (cache.current[lang]) {
      setTranslations(cache.current[lang]);
      return;
    }

    async function loadTranslations() {
      try {
        const res = await fetch(`/translations_${lang}.json`);

        if (!res.ok) throw new Error("Missing translation file");

        const data = await res.json();

        if (Object.keys(data).length > 0) {
          cache.current[lang] = data;
        }

        setTranslations(data);
      } catch (err) {
        console.warn(`⚠️ No translations found for ${lang}`);
        setTranslations({});
      }
    }

    loadTranslations();
  }, [lang]);

  if (!isReady) return null;

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, supportedLangs, translations }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageContextProvider;
