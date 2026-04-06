import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";

const traverse = traverseModule.default;

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT_FILE = path.join(ROOT, "extractedText.json");

// 🔥 NEW: namespace-based storage
let existingStrings: Record<string, string[]> = {};

if (fs.existsSync(OUTPUT_FILE)) {
  existingStrings = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

const newStrings: Record<string, Set<string>> = {};

// 🔥 Normalize
function normalize(text: string): string {
  return text.trim();
}

// 🔥 Validation
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

    let namespace = "common"; // 🔥 default

    traverse(ast, {
      // 🔥 STEP 1: detect namespace
      CallExpression(path: any) {
        const { callee, arguments: args } = path.node;

        // detect useTranslation("namespace")
        if (t.isIdentifier(callee) && callee.name === "useTranslation") {
          const firstArg = args[0];

          if (t.isStringLiteral(firstArg)) {
            namespace = firstArg.value;
          }
        }
      },
    });

    // ensure namespace exists
    if (!newStrings[namespace]) {
      newStrings[namespace] = new Set<string>();
    }

    // 🔥 STEP 2: extract t() strings
    traverse(ast, {
      CallExpression(path: any) {
        const { callee, arguments: args } = path.node;

        if (!t.isIdentifier(callee) || callee.name !== "t") return;

        const firstArg = args[0];
        if (!firstArg) return;

        let extractedValue: string | null = null;

        // ✅ string literal
        if (t.isStringLiteral(firstArg)) {
          extractedValue = firstArg.value;
        }

        // ✅ template literal
        else if (t.isTemplateLiteral(firstArg)) {
          if (firstArg.expressions.length > 0) {
            console.error(`
❌ Invalid template literal detected
📄 File: ${filePath}
📍 Line: ${path.node.loc?.start.line}
👉 Use {{var}} instead of \${var}
`);
            return;
          }

          extractedValue = firstArg.quasis
            .map((q) => q.value.cooked || "")
            .join("");
        }

        if (!extractedValue) return;

        const normalizedText = normalize(extractedValue);

        if (isValidText(normalizedText)) {
          (newStrings[namespace] ??= new Set()).add(normalizedText);
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

// 🔥 MERGE with existing
const finalOutput: Record<string, string[]> = {};

Object.keys(newStrings).forEach((ns) => {
  const existing = new Set(existingStrings[ns] || []);
  const combined = new Set([
    ...existing,
    ...Array.from(newStrings[ns] ?? new Set<string>()),
  ]);

  finalOutput[ns] = Array.from(combined);
});

// keep old namespaces if not touched
Object.keys(existingStrings).forEach((ns) => {
  if (!finalOutput[ns]) {
    finalOutput[ns] = existingStrings[ns] ?? [];
  }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2));

console.log("✅ Extraction complete with namespaces");
