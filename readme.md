# localize-ai

**AI-powered React localization with AST-based extraction, namespace-based loading, and smart caching ⚡**

👉 No regex. No manual cleanup. Just accurate and scalable translations.

> Context-aware AI localization with multi-provider support ⚡

Automatically extract, translate, and serve multilingual UI — powered by AI ⚡

Designed for performance: no unnecessary data, no re-fetching, minimal bundle impact.

---

## ✨ Features

### 🔧 Core

- 🔍 AST-based extraction (no regex)
- 🧩 Supports template literals with variables
- 🧹 Removes unused (dead) translations automatically
- 🌍 AI-powered translations (OpenAI, Gemini)
- ⚡ Incremental translation (only new strings/languages)

### ⚡ Performance

- **Namespace-based splitting**  
  → Each language is split into namespaces (common.json, dashboard.json, etc.)

- **Lazy loading**  
  → Only loads required namespace instead of entire language

- **Caching**  
  → Prevents repeated fetches per language + namespace

### ⚛️ Developer Experience

- 🧠 Zero-config runtime
- ⚛️ React hooks + context
- 🧠 Context-aware translations
- 💸 Cost optimized (no re-translation)
- 🐞 Debug mode (highlight translated & missing strings in UI)
- 🧪 Dry-run mode (preview extraction & translation without modifying files)

---

## ⚡ Performance Optimizations

### localize-ai is optimized for production:

- **Per-locale splitting**
  → Each language is stored separately (translations_en.json, translations_hi.json)
- **Lazy loading**
  → Only loads the active language instead of all translations
- **Caching**
  → Prevents repeated fetches and improves performance

👉 This ensures fast load times and minimal bundle size.

---

### 🧠 Smart Extraction (AST-based)

Localize-ai uses AST parsing instead of regex, ensuring accurate extraction:

- Handles complex code patterns
- Supports template literals with variables
- Avoids false positives

Example:

```
t(`hello {{userName}}, your order {{id}} is ready`, {
  userName,
  id: orderId
});
```

👉 Variables are preserved and translated correctly.

---

### 🧩 Namespace-based Loading

Localize-ai supports namespace-based translation splitting for large applications:

```
public/
  └── locales/
      ├── en/
      │   ├── common.json
      │   ├── dashboard.json
      │   ├── checkout.json
      │   └── ...
      ├── fr/
      │   ├── common.json
      │   ├── dashboard.json
      │   └── ...
```

Why this matters:

- Loads only required translations
- Improves performance for large apps
- Reduces initial bundle size

👉 No more loading the entire language file at once.

---

## 🚀 Smart Caching

Localize-ai caches translations per:

- language
- namespace

This ensures:

- no duplicate network requests
- faster UI rendering
- better runtime performance

---

## 🐞 Debug Mode

localize-ai provides a built-in debug mode to visualize translation status directly in your UI.

Enable debug mode:
```
<LanguageContextProvider debug={true}>
  <App />
</LanguageContextProvider>
```

Behavior:
🟢 Translated strings → highlighted in green
🟡 Missing translations → highlighted in custom color

Configure debug color:
```
// localize.config.js
export default {
  sourceLanguage: "en",
  translationLanguages: ["hi", "fr", "es", "ar"],
  provider: "gemini",
  apikey: "VITE_GEMINI_API_KEY",
  debugColor: "yellow",
  context: "Kit kat condolence message page"
};
```

👉 Helps quickly identify missing translations during development.

---

## 🧪 Dry Run Mode

localize-ai supports a dry-run mode to preview the entire localization pipeline without writing any translations.

Run dry-run:
```
npx localize-ai translate --dry-run
```

What it does:
* Extracts strings using AST
* Validates template literals
* Detects missing / partial translations
* Shows summary without modifying files
* Example output:
```
🧪 Running dry-run (no translations will be made)...

❌ Invalid template literal detected
📄 File: src/App.jsx
📍 Line: 82
👉 Use {{var}} instead of ${var}

✅ Extraction complete with namespaces
✅ Cleaned namespaces: 2

🚀 Starting localization pipeline
ℹ️  Provider: gemini
ℹ️  Source Language: en
ℹ️  Target Languages: hi, fr, es, ar

📊 Summary:
   Total input strings: 22
   🆕 New strings: 0
   🌐 Missing translations: 0
   ⚠️ Partial translations: 0
   Translated now: 0
   Total stored translations: 22

✅ Done
```

Why use dry-run?
🛡️ Safe preview before running translations
🔍 Catch errors (like invalid template literals)
📊 Understand translation coverage

👉 Ideal for CI checks and debugging.

---

## 📦 Installation

```bash
npm install localize-ai
```

---

## ⚙️ Setup (2 steps)

### 1️⃣ Create config

```js
// localize.config.js
export default {
  sourceLanguage: "en",
  translationLanguages: ["hi", "fr"],
  provider: "gemini", // or "openai"
  apikey: "VITE_GEMINI_API_KEY",
  context: "E-commerce checkout UI for buying products",
};
```

👉 Providing context improves translation accuracy by helping AI understand intent (e.g., "Charge" in payments vs battery).

---

### 2️⃣ Add your API key

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## 🚀 Usage

### Step 1: Initialize

```bash
npx localize-ai init
```

---

### Step 2: Extract & translate

```bash
npx localize-ai translate
```

This will:

- scan your codebase
- extract t("text")
- generate translations
- create per-language translation files:

```
public/
  └── locales/
      ├── en/
      │   ├── common.json
      │   ├── [namespace].json
      │   └── ...
      ├── fr/
      │   └── ...

localize.runtime.json
```

---

### Step 3: Wrap your app

```tsx
import { LanguageContextProvider } from "localize-ai";

<LanguageContextProvider>
  <App />
</LanguageContextProvider>;
```

---

### Step 4: Use translations

### Using namespaces

```tsx
const { t } = useTranslation("dashboard");
```

👉 Loads only `dashboard.json` for the active language.

#### If no namespace is provided:

```
const { t } = useTranslation();
```

👉 Uses common.json by default.

---

## 🌍 Change language

```tsx
const { setLang } = useTranslation();

setLang("fr"); // switch language
```

---

## 🧹 Dead Translation Cleanup

```
npx localize-ai delete-sync
```

Localize-ai automatically removes unused translations:

- Detects strings no longer present in code
- Cleans up translation files
- Keeps JSON lean and optimized

👉 Prevents bloated translation files over time.

---

## 🧠 How it works

```text
Code → AST Extract → Namespace Split → AI Translate → JSON → Lazy Load → Cache → UI
```

- Only new strings are translated
- Only missing languages are generated
- Existing translations are reused

---

## 📁 Output

```bash
public/
  └── locales/
      ├── en/
      │   ├── common.json
      │   ├── [namespace].json
      │   └── ...
      ├── fr/
      │   └── ...
```

---

## ⚡ Example

```tsx
<h1>{t("Get started")}</h1>
```

➡️ Automatically becomes:

```json
{
  "common": {
    "Get started": "शुरू करें"
  }
}
```

---

## 🛠 CLI Commands

```bash
npx localize-ai init        # generate runtime config
npx localize-ai translate   # extract + translate
npx localize-ai delete-sync   # delete dead translations
npx localize-ai translate --dry-run   # preview without writing files
```

---

## 🎯 Why localize-ai?

| Feature                          | localize-ai | traditional i18n |
|----------------------------------|------------|------------------|
| Auto extraction                  | ✅         | ❌               |
| AST-based parsing (no regex)     | ✅         | ❌               |
| AI translation                   | ✅         | ❌               |
| Incremental updates              | ✅         | ❌               |
| Namespace-based loading          | ✅         | ⚠️ manual        |
| Lazy loading                     | ✅         | ⚠️ manual        |
| Built-in caching                 | ✅         | ❌               |
| Dead translation cleanup         | ✅         | ❌               |
| Context-aware translations       | ✅         | ❌               |
| Setup time                       | ⚡ minutes | ⏳ hours         |

--- 

## ⚠️ Notes

- Only static strings inside `t("...")` are extracted
- Ensure `public/` folder exists
- API key is required only for translation step

---

## 🗺 Roadmap

### Core Improvements
- [x] AST-based extraction (no regex)
- [x] Template literal support with variables
- [ ] Better error handling & retry logic for failed translations
- [ ] CLI UX improvements (spinners, better logs)

### Performance & Scalability
- [x] Lazy loading translations
- [x] Namespace-based splitting
- [x] Per-locale structure
- [x] Smart caching (per language + namespace)
- [ ] CDN support for translation files

### Features
- [x] Multi-provider support (OpenAI, Gemini)
- [ ] Fallback providers (auto-switch if one fails)
- [ ] Custom translation rules (skip/override specific keys)
- [x] Namespace configuration (custom naming & grouping)

### Developer Experience
- [ ] VS Code extension (highlight untranslated strings)
- [x] Debug mode (show missing translations in UI)
- [x] CLI dry-run mode
- [ ] Type-safe translations (TS support for keys)

### Maintenance & Optimization
- [x] Dead translation cleanup
- [ ] Translation validation (detect missing/interpolated variables)
- [x] Sync check (detect outdated translations)

### Future Ideas
- [ ] Framework support beyond React (Next.js, Vue)
- [ ] Web dashboard for managing translations
- [ ] Analytics (missing keys, usage tracking)
- [ ] Collaboration support (teams & workflows)
---

## 🤝 Contributing

PRs welcome! Feel free to open issues or suggest improvements.

---

## 📄 License

MIT

---

## 💬 Author

**Parth Gupta**

---

## ⭐ Support

If you like this project:

👉 Star the repo
👉 Share with developers
👉 Give feedback

---
