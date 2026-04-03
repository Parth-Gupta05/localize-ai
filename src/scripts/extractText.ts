import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";

const traverse = traverseModule.default;

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT_FILE = path.join(ROOT, "extractedText.json");

let existingStrings = new Set<string>();

if (fs.existsSync(OUTPUT_FILE)) {
  existingStrings = new Set(
    JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"))
  );
}

const newStrings = new Set<string>();

// 🔥 Normalize string (CRITICAL FIX)
function normalize(text: string): string {
  return text
    .trim()
}

// 🔥 Relaxed validation (FIXED)
function isValidText(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^[A-Z0-9-_]+$/.test(text)) return false;
  return true;
}

function extractFromAST(content: string, filePath: string) {
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

        let extractedValue: string | null = null;

        // ✅ STRING LITERAL
        if (t.isStringLiteral(firstArg)) {
          extractedValue = firstArg.value;
        }

        // ✅ TEMPLATE LITERAL
        else if (t.isTemplateLiteral(firstArg)) {
          // ❌ BLOCK dynamic template usage (IMPORTANT)
          if (firstArg.expressions.length > 0) {
            console.error(`
❌ Invalid template literal detected
📄 File: ${filePath}
📍 Line: ${path.node.loc?.start.line}
💡 Code: t(\`...\${}\`)
👉 Fix: t("Text {{var}}", { var })
`);
            return;
          }

          extractedValue = firstArg.quasis
            .map((q) => q.value.cooked || "")
            .join("");
        }

        if (!extractedValue) return;

        const normalizedText = normalize(extractedValue);

        if (
          isValidText(normalizedText) &&
          !existingStrings.has(normalizedText)
        ) {
          newStrings.add(normalizedText);
        }
      },
    });
  } catch {
    console.warn(`⚠️ Failed to parse: ${filePath}`);
  }
}

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      extractFromAST(content, fullPath);
    }
  }
}

scanDir(SRC_DIR);

const updated = [...existingStrings, ...newStrings];

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updated, null, 2));

console.log(`✅ Added ${newStrings.size} new strings`);