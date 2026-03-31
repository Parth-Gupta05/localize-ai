# 🚀 localize-ai


**Plug & Play AI-powered localization for React apps with lazy loading & per-locale splitting**

> Context-aware AI localization with multi-provider support ⚡

Automatically extract, translate, and serve multilingual UI — powered by AI ⚡

Designed for performance: no unnecessary data, no re-fetching, minimal bundle impact.


---

## ✨ Features

### 🔧 Core
* 🔍 Auto-extract static text (`t("...")`)
* 🌍 AI-powered translations (OpenAI, Gemini)
* ⚡ Incremental translation (only new strings/languages)

### ⚡ Performance
* ⚡ Lazy loading (loads only required language)
* 📦 Per-locale splitting (smaller bundles)
* 🚀 Built-in caching (no redundant fetches)

### ⚛️ Developer Experience
* 🧠 Zero-config runtime
* ⚛️ React hooks + context
* 🧠 Context-aware translations
* 💸 Cost optimized (no re-translation)

---

## ⚡ Performance Optimizations

### localize-ai is optimized for production:

* **Per-locale splitting**
→ Each language is stored separately (translations_en.json, translations_hi.json)
* **Lazy loading**
→ Only loads the active language instead of all translations
* **Caching**
→ Prevents repeated fetches and improves performance

👉 This ensures fast load times and minimal bundle size.

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
  provider: "gemini",  // or "openai"
  apikey: "VITE_GEMINI_API_KEY",
  context: "E-commerce checkout UI for buying products"
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

* scan your codebase
* extract t("text")
* generate translations
* create per-language translation files:

```
public/
  ├── translations_en.json
  ├── translations_hi.json
  ├── translations_fr.json
  └── ...
  
localize.runtime.json
```

---

### Step 3: Wrap your app

```tsx
import { LanguageContextProvider } from "localize-ai";

<LanguageContextProvider>
  <App />
</LanguageContextProvider>
```

---

### Step 4: Use translations

```tsx
import { useTranslation } from "localize-ai";

function App() {
  const { t } = useTranslation();

  return <h1>{t("Hello world")}</h1>;
}
```

---

## 🌍 Change language

```tsx
const { setLang } = useTranslation();

setLang("fr"); // switch language
```

---

## 🧠 How it works

```text
Code → Extract → Clean → AI Translate → JSON → React Context → UI
```

* Only new strings are translated
* Only missing languages are generated
* Existing translations are reused

---

## 📁 Output

```bash
public/
  ├── translations_en.json
  ├── translations_hi.json
  ├── translations_fr.json
  └── ...
```

---

## ⚡ Example

```tsx
<h1>{t("Get started")}</h1>
```

➡️ Automatically becomes:

```json
{
  "Get started": {
    "en": "Get started",
    "hi": "शुरू करें",
    "fr": "Commencer"
  }
}
```

---

## 🛠 CLI Commands

```bash
npx localize-ai init        # generate runtime config
npx localize-ai translate   # extract + translate
```

---

## 🎯 Why localize-ai?

| Feature             | localize-ai | traditional i18n |
| ------------------- | ----------- | ---------------- |
| Auto extraction     | ✅           | ❌                |
| AI translation      | ✅           | ❌                |
| Incremental updates | ✅           | ❌                |
| Setup time          | ⚡ minutes   | ⏳ hours          |

---

## ⚠️ Notes

* Only static strings inside `t("...")` are extracted
* Ensure `public/` folder exists
* API key is required only for translation step

---

## 🗺 Roadmap

### Core Improvements
* [ ] AST-based extraction (no regex)
* [ ] Better error handling & retry logic for failed translations
* [ ] CLI UX improvements (spinners, better logs)

### Performance & DX
* [x] Lazy loading translations
* [x] Per-locale splitting
* [x] Built-in caching
* [ ] CDN support for translation files

### Features
* [x] Multi-provider support (OpenAI, Gemini)
* [ ] Fallback providers (auto-switch if one fails)
* [ ] Custom translation rules (skip/override specific keys)
* [ ] Namespace support (group translations)

### Developer Experience
* [ ] VS Code extension (highlight untranslated strings)
* [ ] Debug mode (show missing translations in UI)
* [ ] CLI dry-run mode

### Future Ideas
* [ ] Support for frameworks beyond React (Next.js, Vue)
* [ ] Dashboard for managing translations
* [ ] Analytics (missing keys, usage tracking)

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
