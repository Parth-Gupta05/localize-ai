import fs from "fs";
import path from "path";

const ROOT = process.cwd(); // ✅ user project
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT_FILE = path.join(ROOT,"extractedText.json");

let existingStrings = new Set<string>();

if (fs.existsSync(OUTPUT_FILE)) {
  existingStrings = new Set(
    JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"))
  );
}

const newStrings = new Set<string>();

function isValidText(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (/^\d+$/.test(text)) return false;
  if (text.includes("@")) return false;
  if (/^[A-Z0-9-]+$/.test(text)) return false;
  if (/₹|\$|€/.test(text)) return false;
  return true;
}

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
      const content = fs.readFileSync(fullPath, "utf-8");

      const regex =
        /t\(\s*["'`]([^"'`]+)["'`]\s*(?:,\s*[a-zA-Z0-9_.]+)?\s*\)/g;

      let match: RegExpExecArray | null;

while ((match = regex.exec(content)) !== null) {
  const text = match[1]!.trim();

  if (isValidText(text) && !existingStrings.has(text)) {
    newStrings.add(text);
  }
}
    }
  }
}

scanDir(SRC_DIR);

const updated = [...existingStrings, ...newStrings];

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updated, null, 2));

console.log(`✅ Added ${newStrings.size} new strings`);