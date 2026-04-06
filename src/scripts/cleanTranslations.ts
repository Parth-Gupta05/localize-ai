import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const INPUT = path.join(ROOT, "extractedText.json");
const OUTPUT = path.join(ROOT, "cleaned_strings.json");

function isValid(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^[A-Z0-9-_]+$/.test(text)) return false;
  return true;
}

if (!fs.existsSync(INPUT)) {
  console.error("❌ extractedText.json not found");
  process.exit(1);
}

// 🔥 UPDATED TYPE (namespace based)
const raw: Record<string, string[]> = JSON.parse(
  fs.readFileSync(INPUT, "utf-8"),
);

// 🔥 CLEAN PER NAMESPACE (same logic preserved)
const cleaned: Record<string, string[]> = {};

Object.entries(raw).forEach(([namespace, strings]) => {
  cleaned[namespace] = strings.filter(isValid);
});

// 🔥 WRITE SAME STRUCTURE
fs.writeFileSync(OUTPUT, JSON.stringify(cleaned, null, 2));

console.log(`✅ Cleaned namespaces: ${Object.keys(cleaned).length}`);
