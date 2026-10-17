# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## KAIROS local AI assistant

The `/assistant` page uses a local Ollama server and the `gemma3:4b-it-qat` model. The browser sends the current profile, derived financial metrics, goals, and stored transactions to Ollama on the same machine. No public AI API is used, and chat history is kept in page memory only.

### Run Ollama

Install Ollama from [ollama.com](https://ollama.com), then download the model:

```bash
ollama pull gemma3:4b-it-qat
```

Start Ollama with the Vite origins allowed. On Linux/macOS:

```bash
OLLAMA_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 ollama serve
```

On Windows PowerShell, set the user environment variable, restart the Ollama desktop app, or run the server in a PowerShell window:

```powershell
$env:OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
ollama serve
```

In a second terminal, from this project folder:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The defaults in `.env.local` use `http://127.0.0.1:11434` and `gemma3:4b-it-qat`. Change `VITE_OLLAMA_BASE_URL` if Ollama runs on another machine, and restart Vite after changing environment variables.

The assistant follows the local-first design in `doc/Research_Report_Globathon.pdf`: it explains financial velocity, goal feasibility, cash-flow trade-offs, and asset-liability matching while treating its output as educational guidance rather than regulated investment advice.

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
