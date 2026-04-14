import fs from "fs";
import path from "path";
import { loadUserConfig } from "./loadConfig.js";

export async function generateRuntimeConfig() {
  const config = await loadUserConfig();

  // ✅ Required fields (fail fast)
  if (!config.sourceLanguage) {
    console.error("❌ Missing 'sourceLanguage'");
    process.exit(1);
  }

  if (!config.translationLanguages) {
    console.error("❌ Missing 'translationLanguages'");
    process.exit(1);
  }

  if (!config.provider) {
    console.error("❌ Missing 'provider'");
    process.exit(1);
  }

  if (!config.apikey) {
    console.error("❌ Missing 'apikey'");
    process.exit(1);
  }

  // ✅ Normalize optional field
const context =
  typeof config.context === "string" ? config.context : "";
  // ✅ Transform
  const runtimeConfig = {
    sourceLanguage: config.sourceLanguage,
    supportedLangs: config.translationLanguages,
    apikey: config.apikey,
    provider: config.provider,
    context,
    debugColor:config.debugColor
  };

  const outputPath = path.resolve(process.cwd(), "localize.runtime.json");

  try {
    fs.writeFileSync(outputPath, JSON.stringify(runtimeConfig, null, 2));
    console.log("✅ Config ready (localize.runtime.json)");
  } catch {
    console.error("❌ Failed to write localize.runtime.json");
    process.exit(1);
  }
}
