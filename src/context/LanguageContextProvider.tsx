import { useEffect, useRef, useState } from "react";
import LanguageContext from "./LanguageContext.js";

function LanguageContextProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>("en");
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 🔥 cache → lang → namespace → translations
  const cache = useRef<Record<string, Record<string, Record<string, string>>>>(
    {},
  );

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/localize.runtime.json");
        const config = await res.json();

        setSupportedLangs(config.supportedLangs || []);

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

  if (!isReady) return null;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        supportedLangs,
        cache: cache.current, // 🔥 expose cache
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageContextProvider;
