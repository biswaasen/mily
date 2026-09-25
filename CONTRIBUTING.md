# Contributing to Mily

Fork the repository, create a focused branch, and follow the setup instructions in [README.md](README.md). Keep changes small enough to review and explain the user-visible problem they solve.

## Before opening a pull request

```sh
npm ci
npm test
npm run typecheck
npm run build:react
npm run build:fn
```

On macOS, run `npm start` and check the flows affected by your change. For recording changes, test Fn press/release, Escape cancellation, transcription, pasting into another app, and permission failures. For settings changes, check persistence after restarting. For release changes, test `npm run build:unsigned` and launch the resulting app on the relevant architecture.

Automated CI runs mocked AI/recording regression tests, checks types, renderer bundling, and Swift compilation. It does not exercise microphone access, Accessibility permissions, paid provider requests, or signed distribution.

Include a clear description, reproduction steps for bugs, screenshots for UI changes, and your validation results in the pull request. Match the surrounding code style. Update the README when changing commands, permissions, configuration, or behavior. Commit `package-lock.json` whenever dependencies change.

Do not commit API keys, `.env` files, signing credentials, recordings, personal transcripts, generated `dist/` files, or compiled native helpers. Use `.env.example` for placeholders. Treat collaborators respectfully and keep feedback specific and constructive.

For ordinary bugs, open a GitHub issue with your macOS version, CPU architecture, Node version, app version, reproduction steps, and redacted logs. Follow [SECURITY.md](SECURITY.md) for vulnerabilities.
