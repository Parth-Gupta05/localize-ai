import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";

const traverse = traverseModule.default;

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

const EXTRACTED_FILE = path.join(ROOT, "extractedText.json");
const CLEANED_FILE = path.join(ROOT, "cleaned_strings.json");

// 👇 translations folder (you can adjust if needed)
const PUBLIC_DIR = path.join(ROOT, "public");

// 🔥 normalize (same as runtime)
function normalize(text: string): string {
  return text.trim();
}

// 🔥 collect current keys from AST
function extractKeys(): Set<string> {
  const usedKeys = new Set<string>();

  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);

      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
        const content = fs.readFileSync(fullPath, "utf-8");

        try {
          const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
          });

          traverse(ast, {
            CallExpression(path: any) {
              const { callee, arguments: args } = path.node;

              if (!t.isIdentifier(callee) || callee.name !== "t") return;

              const firstArg = args[0];
              if (!firstArg) return;

              let value: string | null = null;

              if (t.isStringLiteral(firstArg)) {
                value = firstArg.value;
              } else if (t.isTemplateLiteral(firstArg)) {
                if (firstArg.expressions.length > 0) return;

                value = firstArg.quasis
                  .map((q) => q.value.cooked || "")
                  .join("");
              }

              if (!value) return;

              usedKeys.add(normalize(value));
            },
          });
        } catch {
          console.warn(`⚠️ Failed parsing ${fullPath}`);
        }
      }
    }
  }

  scanDir(SRC_DIR);

  return usedKeys;
}

// 🔥 remove unused keys from JSON file
function cleanJsonFile(filePath: string, usedKeys: Set<string>) {
  if (!fs.existsSync(filePath)) return 0;

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let updated: any;
  let removedCount = 0;

  if (Array.isArray(data)) {
    const before = data.length;

    updated = data.filter((key: string) => usedKeys.has(normalize(key)));

    removedCount = before - updated.length;
  } else {
    const before = Object.keys(data).length;

    updated = Object.fromEntries(
      Object.entries(data).filter(([key]) => usedKeys.has(normalize(key))),
    );

    const after = Object.keys(updated).length;
    removedCount = before - after;
  }

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

  return removedCount;
}

// 🔥 main runner
function run() {
  console.log("🔍 Scanning codebase...");

  const usedKeys = extractKeys();

  console.log(`✅ Found ${usedKeys.size} active keys\n`);

  let totalRemoved = 0;

  function logResult(filePath: string, removed: number) {
    const name = path.basename(filePath);

    if (removed > 0) {
      console.log(`🧹 ${name} → removed ${removed} keys`);
      totalRemoved += removed;
    } else {
      console.log(`✅ ${name} → no changes`);
    }
  }

  // extracted files
  logResult(EXTRACTED_FILE, cleanJsonFile(EXTRACTED_FILE, usedKeys));
  logResult(CLEANED_FILE, cleanJsonFile(CLEANED_FILE, usedKeys));

  // translations
  const LOCALES_DIR = path.join(ROOT, "public", "locales");

  if (fs.existsSync(LOCALES_DIR)) {
    const langs = fs.readdirSync(LOCALES_DIR);

    langs.forEach((lang) => {
      const langDir = path.join(LOCALES_DIR, lang);

      if (!fs.statSync(langDir).isDirectory()) return;

      const files = fs.readdirSync(langDir);

      files.forEach((file) => {
        if (file.endsWith(".json")) {
          const fullPath = path.join(langDir, file);

          logResult(fullPath, cleanJsonFile(fullPath, usedKeys));
        }
      });
    });
  }

  console.log("\n🚀 Delete sync completed!");

  if (totalRemoved > 0) {
    console.log(`🔥 Total removed keys: ${totalRemoved}`);
  } else {
    console.log("✨ No unused keys found");
  }
}

run();
