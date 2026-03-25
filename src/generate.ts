import fs from "fs";
import path from "path";
import { loadUserConfig } from "./loadConfig.js";

export async function generateRuntimeConfig() {
  const config = await loadUserConfig();

  // Transform config if needed
  const runtimeConfig = {
    sourceLanguage: config.sourceLanguage,
    supportedLangs: config.translationLanguages,
    apikey: config.apikey
  };

  const outputPath = path.resolve(process.cwd(), "localize.runtime.json");

  fs.writeFileSync(outputPath, JSON.stringify(runtimeConfig, null, 2));

  console.log("✅ localize.runtime.json generated successfully!");
}