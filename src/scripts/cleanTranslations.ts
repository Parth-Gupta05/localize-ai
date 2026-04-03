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

const raw: string[] = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const cleaned = raw.filter(isValid);

fs.writeFileSync(OUTPUT, JSON.stringify(cleaned, null, 2));

console.log(`✅ Cleaned strings: ${cleaned.length}`);