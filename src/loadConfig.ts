import path from "path";
import { pathToFileURL } from "url";

export async function loadUserConfig() {
  const configPath = path.resolve(process.cwd(), "localize.config.js");

  try {
    const config = await import(pathToFileURL(configPath).href);
    return config.default;
  } catch (err) {
    console.error("❌ Failed to load localize.config.js");
    process.exit(1);
  }
}