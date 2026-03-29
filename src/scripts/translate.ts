import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

dotenv.config({ path: path.resolve(process.cwd(), ".env") }); // ✅ USER ENV

const log = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  warn: (msg: string) => console.log(`⚠️  ${msg}`),
  step: (msg: string) => console.log(`\n🚀 ${msg}`),
};

const ROOT = process.cwd();
const runtimeConfigPath = path.join(ROOT, "localize.runtime.json");
if (!fs.existsSync(runtimeConfigPath)) {
  console.error("❌ localize.runtime.json not found. Run init first.");
  process.exit(1);
}
const runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf-8"));
const { sourceLanguage, supportedLangs, apikey, provider, context } =
  runtimeConfig;

if (!sourceLanguage) {
  log.error("sourceLanguage is required in localize.config.js");
  process.exit(1);
}

if (!supportedLangs || supportedLangs.length === 0) {
  log.error("translationLanguages cannot be empty");
  process.exit(1);
}

if (!provider) {
  log.error("provider (gemini/openai) is required");
  process.exit(1);
}

if (!apikey) {
  log.error("apikey variable name is missing in config");
  process.exit(1);
}

if (!["gemini", "openai"].includes(provider)) {
  log.error(`Invalid provider: ${provider}`);
  process.exit(1);
}

const API_KEY = process.env[apikey];

if (!API_KEY) {
  console.error(`❌ ${provider.toUpperCase()} API KEY missing in .env`);
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const openai = new OpenAI({
  apiKey: API_KEY,
});

const INPUT = path.join(ROOT, "cleaned_strings.json");
const OUTPUT = path.join(ROOT, "public", "translations.json");

if (!fs.existsSync(INPUT)) {
  log.error("cleaned_strings.json not found. Run extraction first.");
  process.exit(1);
}

const CHUNK_SIZE = 100;

function chunk(arr: string[], size: number) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// 🔥 NEW: detect missing languages per text
function getMissingLangs(
  text: string,
  existing: any,
  supportedLangs: string[],
) {
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

${
  context
    ? `Context (optional, use only if helpful):
"${context}"`
    : ""
}

Guidelines:
- Use the provided context ONLY if it improves translation quality
- Ignore the context if it is not relevant to the text
- Preserve meaning, tone, and intent of UI text
- Do NOT over-interpret context
- Keep translations natural and concise

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

async function translateChunk(
  model: any,
  chunkData: string[],
  existing: any,
  supportedLangs: string[],
) {
  const prompt = buildPrompt(chunkData, existing, supportedLangs);

  // 🔥 GEMINI FLOW
  if (provider === "gemini") {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    let text = response.text();
    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);
  }

  // 🔥 OPENAI FLOW
  if (provider === "openai") {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a translation engine. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const choice = completion.choices?.[0];

    if (!choice || !choice.message?.content) {
      throw new Error("❌ Invalid response from OpenAI");
    }

    let text = choice.message.content;

    if (!text) {
      console.log("⚠️ Empty response from OpenAI");
    }

    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);
  }

  throw new Error("Invalid provider");
}

async function run() {
  const startTime = Date.now();

  log.step("Starting localization pipeline");

  log.info(`Provider: ${provider}`);

  log.info(`Source Language: ${sourceLanguage}`);

  log.info(`Target Languages: ${supportedLangs.join(", ")}`);

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
      (lang: string) => !existingEntry[lang],
    );

    return missingLangs.length > 0;
  });

  const chunks = chunk(filtered, CHUNK_SIZE);

  let final = { ...existing };

  function updateProgress(current: number, total: number) {
    const percent = Math.floor((current / total) * 100);
    const barLength = 20;
    const filled = Math.floor((percent / 100) * barLength);
    const bar = "█".repeat(filled) + "-".repeat(barLength - filled);

    process.stdout.write(
      `\r⏳ Translating: [${bar}] ${percent}% (${current}/${total})`,
    );
  }

  for (const [i, chunk] of chunks.entries()) {
    updateProgress(i + 1, chunks.length);

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
    } catch (err: any) {
      log.error(`Chunk ${i + 1} failed`);
      console.log(err?.message || err);
    }
  }
  process.stdout.write("\n"); // move to next line after progress

  fs.writeFileSync(OUTPUT, JSON.stringify(final, null, 2));

  log.success("translations.json generated successfully!");

  console.log("\n📊 Summary:");
  console.log(`   Total input strings: ${texts.length}`);
  console.log(`   Translated now: ${filtered.length}`);
  console.log(`   Total stored translations: ${Object.keys(final).length}`);
  console.log(`   Output: public/translations.json\n`);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱ Completed in ${duration}s`);
}

run();
