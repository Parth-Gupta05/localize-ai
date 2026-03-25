import { useEffect, useState } from "react";
import LanguageContext from "./LanguageContext.js";

function LanguageContextProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>("en");
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [translations, setTranslations] = useState<any>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const configRes = await fetch("/localize.runtime.json");
        const config = await configRes.json();

        setSupportedLangs(config.supportedLangs || []);
        setLang(
          config.supportedLangs?.includes(config.sourceLanguage)
            ? config.sourceLanguage
            : "en"
        );

        const transRes = await fetch("/translations.json");
        if (!transRes.ok) throw new Error("No translations");

        const data = await transRes.json();
        setTranslations(data);

        setIsReady(true);
      } catch (err) {
        console.warn("⚠️ Failed to load localization", err);
        setTranslations({});
        setIsReady(true);
      }
    }

    load();
  }, []);

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