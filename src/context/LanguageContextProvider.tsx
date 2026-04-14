import { useEffect, useRef, useState } from "react";
import LanguageContext from "./LanguageContext.js";

function LanguageContextProvider({ children, debug=false }: { children: React.ReactNode, debug?:boolean }) {
  const [lang, setLang] = useState<string>("en");
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [debugColor, setDebugColor] = useState<string>("red");

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
        if(config.debugColor){
          setDebugColor(config.debugColor)
        };
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
        debugColor,
        debug,
        cache: cache.current, // 🔥 expose cache
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageContextProvider;
