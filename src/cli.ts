#!/usr/bin/env node

import { execSync } from "child_process";
import { generateRuntimeConfig } from "./generate.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const command = process.argv[2];

if (command === "init") {
  generateRuntimeConfig();
}
else if (command === "delete-sync"){
  const deletePath = path.join(__dirname, "scripts", "deleteSync.js");
  execSync(`node "${deletePath}"`, { stdio: "inherit" });
  
  console.log("✅ Done");

}
else if (command === "translate") {
  const isDryRun = process.argv.includes("--dry-run");

  console.log(
    isDryRun
      ? "🧪 Running dry-run (no translations will be made)..."
      : "🚀 Running localization pipeline..."
  );

  const extractPath = path.join(__dirname, "scripts", "extractText.js");
  const cleanPath = path.join(__dirname, "scripts", "cleanTranslations.js");
  const translatePath = path.join(__dirname, "scripts", "translate.js");

  execSync(`node "${extractPath}"`, { stdio: "inherit" });
  execSync(`node "${cleanPath}"`, { stdio: "inherit" });

  // 🔥 pass flag forward
  execSync(
    `node "${translatePath}" ${isDryRun ? "--dry-run" : ""}`,
    { stdio: "inherit" }
  );

  console.log("✅ Done");
} 
else {
  console.log("❌ Unknown command");
}