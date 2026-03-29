import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadUserConfig() {
  const configPath = path.resolve(process.cwd(), "localize.config.js");

  // ✅ 1. File existence
  if (!fs.existsSync(configPath)) {
    console.error("❌ localize.config.js not found. Run: npx localize-ai init");
    process.exit(1);
  }

  try {
    const configModule = await import(pathToFileURL(configPath).href);
    const config = configModule.default;

    // ✅ 2. Validate required fields (fail fast with exact reason)
    if (!config?.sourceLanguage) {
      throw new Error("Missing 'sourceLanguage'");
    }

    if (!config?.translationLanguages) {
      throw new Error("Missing 'translationLanguages'");
    }

    if (!Array.isArray(config.translationLanguages)) {
      throw new Error("'translationLanguages' must be an array");
    }

    if (config.translationLanguages.length === 0) {
      throw new Error("'translationLanguages' cannot be empty");
    }

    if (!config?.provider) {
      throw new Error("Missing 'provider'");
    }

    if (!["gemini", "openai"].includes(config.provider)) {
      throw new Error(`Invalid provider '${config.provider}'`);
    }

    if (!config?.apikey) {
      throw new Error("Missing 'apikey' (env variable name)");
    }

    return config;
  } catch (err: any) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}