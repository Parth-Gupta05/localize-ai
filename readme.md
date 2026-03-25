# 🚀 localize-ai

**Plug & Play AI-powered localization for React apps**

Automatically extract, translate, and serve multilingual UI — powered by AI ⚡

---

## ✨ Features

* 🔍 Auto-extract static text from your codebase (`t("...")`)
* 🌍 AI-powered translations (Gemini)
* ⚡ Incremental translation (only new strings + languages)
* 🧠 Zero config runtime (auto loads translations)
* ⚛️ React hooks + context out of the box
* 💸 Cost optimized (no re-translation of existing content)

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
  provider: "gemini",
  apikey: "VITE_GEMINI_API_KEY"
};
```

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
* extract `t("text")`
* generate translations
* create:

```
public/translations.json
public/localize.runtime.json
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

setLang("hi"); // switch language
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
  ├── translations.json
  └── localize.runtime.json
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

* [ ] AST-based extraction (no regex)
* [ ] Multi-provider support (OpenAI, etc.)
* [ ] Lazy loading translations
* [ ] CLI UI improvements

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
