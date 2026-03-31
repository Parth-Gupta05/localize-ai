import { createContext, useContext } from "react";

type LanguageContextType = {
  lang: string;
  supportedLangs: string[];
  setLang: (lang: string) => void;
  translations: Record<string, string>;

};

// 👇 safe: default is null
const LanguageContext = createContext<LanguageContextType | null>(null);

export default LanguageContext;