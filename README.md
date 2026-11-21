# Blockbright

A free, account-free web app (PWA) that teaches young people aged 12+ how crypto works and how to stay safe. Simulations only: no real money, no real wallets, no real tokens. No ads, no trackers, no personal data.

## Develop

```sh
npm install
npm run dev      # local dev server
npm run check    # content check: keys, glossary, explanations, ICU syntax
npm test         # unit tests
npm run build    # check + type-check + production build into dist/
```

## Structure

- `src/content/lessons/*.json`: lesson structure (language-free)
- `src/locales/<lang>/*.json`: all texts; English is the source language
- `src/content/glossary/<lang>.json`: glossary; the English file is the locked source for the English term rule
- Terms in text: `[[id]]` or `[[id|inflected form]]`

Hosting: Netlify (`netlify.toml`).
