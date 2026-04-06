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
  existingLangMap: Record<string, Record<string, string>>,
  supportedLangs: string[],
) {
  return supportedLangs.filter((lang) => {
    return !existingLangMap[lang]?.[text];
  });
}

function escapeText(text: string) {
  return text.replace(/"/g, '\\"');
}

function buildPrompt(
  chunk: string[],
  existingLangMap: any,
  supportedLangs: string[],
) {
  const instructions = chunk
    .map((text) => {
      const missing = getMissingLangs(text, existingLangMap, supportedLangs);
      if (missing.length === 0) return null;

      const safeText = escapeText(text);

      return `"${safeText}": {
        "${sourceLanguage}": "${safeText}",
        ${missing.map((l: string) => `"${l}": "..."`).join(",\n        ")}
      }`;
    })
    .filter(Boolean);

  return `
You are a localization engine for UI text.

Translate ONLY the missing languages.

${context ? `Context (use only if helpful): "${context}"` : ""}

Guidelines:
- Preserve meaning, tone, and intent (concise, UI-friendly)
- Ignore context if not useful
- Use native script and standard formal language
- Each language must strictly follow its standard vocabulary and grammar. Do not mix with any other language, even if similar.
- Do not mix languages (strict per ISO code)
- Keep keys unchanged (exact source string)
- Keep technical/brand terms if translation is unnatural

Rules:
- Return ONLY valid JSON
- No explanation or markdown
- Do NOT overwrite existing translations
- Include ONLY missing languages per entry

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
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 20,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
    const response = await result.response;

    let text = response.text();
    text = text.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON parse failed");
      console.log(text);
      throw err;
    }
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

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON parse failed");
      console.log(text);
      throw err;
    }
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

  const raw: Record<string, string[]> = JSON.parse(
    fs.readFileSync(INPUT, "utf-8"),
  );

  const namespaceMap: Record<string, string[]> = raw;

  const texts: string[] = Object.values(namespaceMap).flat();

  const LOCALES_DIR = path.join(ROOT, "public", "locales");

  const existingLangMap: Record<string, Record<string, string>> = {};

  const allLangs = [sourceLanguage, ...supportedLangs];

  for (const lang of allLangs) {
    existingLangMap[lang] = {};

    for (const namespace of Object.keys(namespaceMap)) {
      const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);

      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        Object.assign(existingLangMap[lang], data);
      }
    }
  }

  // ✅ Filter texts needing translation
  const filtered = texts.filter((t) => {
    const hasSource = existingLangMap[sourceLanguage]?.[t];

    if (!hasSource) return true;

    const missingLangs = supportedLangs.filter((lang: string) => {
      return !(existingLangMap[lang] && existingLangMap[lang][t]);
    });

    return missingLangs.length > 0;
  });

  const chunks = chunk(filtered, CHUNK_SIZE);

  // ✅ Progress bar
  function updateProgress(current: number, total: number) {
    const percent = Math.floor((current / total) * 100);
    const barLength = 20;
    const filled = Math.floor((percent / 100) * barLength);
    const bar = "█".repeat(filled) + "-".repeat(barLength - filled);

    process.stdout.write(
      `\r⏳ Translating: [${bar}] ${percent}% (${current}/${total})`,
    );
  }

  // ✅ Translation loop
  for (const [i, chunk] of chunks.entries()) {
    updateProgress(i + 1, chunks.length);

    try {
      const res = await translateChunk(
        model,
        chunk,
        existingLangMap,
        supportedLangs,
      );

      for (const key in res) {
        const entry = res[key];

        if (typeof entry !== "object" || entry === null) {
          log.warn(`⚠️ Invalid format for key: ${key}`);
          continue;
        }

        for (const lang of Object.keys(entry)) {
          if (!allLangs.includes(lang)) continue;

          if (!existingLangMap[lang]) {
            existingLangMap[lang] = {};
          }

          existingLangMap[lang][key] = entry[lang];
        }
      }
    } catch (err: any) {
      log.error(`Chunk ${i + 1} failed`);
      console.log(err?.message || err);
    }
  }

  process.stdout.write("\n");

  // ✅ Ensure public folder exists
  // ✅ Ensure locales root exists
  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  // ✅ Write namespace-based files
  for (const lang of allLangs) {
    for (const namespace of Object.keys(namespaceMap)) {
      const dir = path.join(LOCALES_DIR, lang);
      const filePath = path.join(dir, `${namespace}.json`);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let existingData: Record<string, string> = {};

      if (fs.existsSync(filePath)) {
        existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }

      const namespaceStrings = namespaceMap[namespace] ?? [];

      const updated: Record<string, string> = { ...existingData };

      for (const text of namespaceStrings) {
        if (existingLangMap[lang]?.[text]) {
          updated[text] = existingLangMap[lang][text];
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    }
  }

  log.success("translations generated successfully!");

  console.log("\n📊 Summary:");
  console.log(`   Total input strings: ${texts.length}`);
  console.log(`   Translated now: ${filtered.length}`);
  console.log(
    `   Total stored translations: ${
      Object.values(existingLangMap[sourceLanguage] || {}).length
    }`,
  );

  // ✅ Updated log
  console.log(`   Output: public/locales/{lang}/{namespace}.json\n`);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱ Completed in ${duration}s`);
}

run();
