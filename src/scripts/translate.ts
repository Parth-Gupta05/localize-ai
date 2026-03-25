import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(process.cwd(), ".env") }); // ✅ USER ENV

const ROOT = process.cwd();
const runtimeConfigPath = path.join(ROOT, "localize.runtime.json");
if (!fs.existsSync(runtimeConfigPath)) {
  console.error("❌ localize.runtime.json not found. Run init first.");
  process.exit(1);
}
const runtimeConfig = JSON.parse(
  fs.readFileSync(runtimeConfigPath, "utf-8")
);
const { sourceLanguage, supportedLangs, apikey } = runtimeConfig;

const API_KEY = process.env[apikey];

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const INPUT = path.join(ROOT, "clean_strings.json");
const OUTPUT = path.join(ROOT,"public","translations.json");

const CHUNK_SIZE = 100;

function chunk(arr: string[], size: number) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// 🔥 NEW: detect missing languages per text
function getMissingLangs(text: string, existing: any, supportedLangs: string[]) {
  const existingEntry = existing[text] || {};
  return supportedLangs.filter((lang: string) => !existingEntry[lang]);
}

function buildPrompt(chunk: string[], existing: any, supportedLangs: string[]) {
  const instructions = chunk.map((text) => {
    const missing = getMissingLangs(text, existing, supportedLangs);

    return `"${text}": {
      "${sourceLanguage}": "${text}",
      ${missing.map((l: string) => `"${l}": "..."`).join(",\n      ")}
    }`;
  });

  return `
You are a translation engine.

Translate ONLY the missing languages.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown
- Do NOT overwrite existing translations

Structure:
{
  ${instructions.join(",\n")}
}

Input:
${JSON.stringify(chunk)}
`;
}

async function translateChunk(model: any, chunkData: string[], existing: any, supportedLangs: string[]) {
  const prompt = buildPrompt(chunkData, existing, supportedLangs);

  const result = await model.generateContent(prompt);
  const response = await result.response;

  let text = response.text();
  text = text.replace(/```json|```/g, "").trim();

  return JSON.parse(text);
}

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const texts: string[] = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

  let existing: Record<string, any> = {};

  if (fs.existsSync(OUTPUT)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
  }



  const filtered = texts.filter((t) => {
  const existingEntry = existing[t];

  // new string → translate
  if (!existingEntry) return true;

  // check if any language missing
  const missingLangs = supportedLangs.filter(
    (lang: string) => !existingEntry[lang]
  );

  return missingLangs.length > 0;
});

  const chunks = chunk(filtered, CHUNK_SIZE);

  let final = { ...existing };

  for (const [i, chunk] of chunks.entries()) {
  console.log(`🚀 Chunk ${i + 1}/${chunks.length}`);

  try {
    const res = await translateChunk(model, chunk, existing, supportedLangs);
    for (const key in res) {
  if (!final[key]) {
    final[key] = res[key];
  } else {
    final[key] = {
      ...final[key],
      ...res[key], // only adds missing languages
    };
  }
}
  } catch {
    console.log("❌ chunk failed");
  }
}

  fs.writeFileSync(OUTPUT, JSON.stringify(final, null, 2));

  console.log("✅ translations.json created");
}

run();