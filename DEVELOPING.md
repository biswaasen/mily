# Developing Mily

Start with the quick setup in [README.md](README.md). This guide covers development, data storage, packaging, and troubleshooting.

## Development

```sh
npm run dev
```

This completes the initial build before launching Electron, watches the renderer sources, and stops the watcher when Electron exits. The app's file watchers reload renderer bundles. Restart the process after changing main-process JavaScript or Swift.

| Command | Purpose |
| --- | --- |
| `npm start` | Compile and run locally once |
| `npm run dev` | Run with renderer rebuilds |
| `npm run build:react` | Bundle the React interface into `dist/` |
| `npm run build:fn` | Compile the native helper for this Mac |
| `npm test` | Run regression tests without credentials or network requests |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run build:unsigned` | Create unsigned macOS DMG/ZIP packages for local testing |
| `npm run build` / `npm run dist` | Create signed, notarized release packages |
| `npm run upload` | Upload existing release artifacts to your configured GCS bucket |
| `npm run publish` | Build signed packages, then upload them |

Run `npm test` for mocked regression tests. There is no automated end-to-end test suite yet. See [CONTRIBUTING.md](CONTRIBUTING.md) for validation and manual checks.

## Code layout

- `main.js`, `windows.js`: Electron lifecycle, windows, and menus.
- `ipc/`: renderer/main-process requests, recording, and settings.
- `services/`: Groq requests, keyboard listeners, local data, and updates.
- `src/`: React interface, hooks, and TypeScript types.
- `native/fn-listener.swift`: Fn/Globe key event listener.
- `store.js`: local settings, provider/model defaults, and legacy migration.
- `config/`: local and production update configuration.
- `scripts/`: development runner, packaging, notarization, and uploads.

## Data and privacy

Mily sends recorded audio to Groq for transcription. It sends the transcript, current app name, configured prompt, user name, saved words, and saved links for language processing. A short selection of saved words and your language preference also accompany transcription requests. Provider availability, usage charges, and data handling depend on your account and provider settings.

Settings, the API key, and message history are stored locally using `electron-store`, without application-level encryption, typically at `~/Library/Application Support/mily/mily-config.json`. Development paths may differ. Current AI progress logs omit transcript and response text. Older versions logged both, so redact existing logs before sharing them. Pasting uses the system clipboard and macOS automation.

Older `mickey-config.json` and legacy Mily settings are imported when the current store has no API key. Existing source files are left in place. The renamed bundle identifier is `com.mily.app`; macOS permissions may need to be granted again.

## Packaging and releases

Unsigned testing builds do not need credentials:

```sh
npm run build:unsigned
```

Artifacts are written to `dist/`. Packaging builds a universal Swift helper and both Intel and Apple Silicon app packages. Unsigned builds are for local testing and may be blocked by Gatekeeper when distributed. Test on both architectures before publishing a release.

For signed releases, copy `.env.example` to `.env`, set the Apple notarization credentials, and install a Developer ID Application certificate in your Keychain (or configure `CSC_LINK` and `CSC_KEY_PASSWORD`). Then run `npm run build`. Secrets and certificates must stay out of Git.

Automatic updates are disabled by default. To distribute updates, set `UPDATE_URL` in `config/production.config.js` to an HTTPS feed you control before building. The feed must serve `latest-mac.yml` and its referenced artifacts. For the included GCS uploader, set `GCS_BUCKET=gs://your-bucket`, install/authenticate the Google Cloud CLI, and configure public read access for release files. `npm run upload` uploads artifacts first and the manifest last. No bucket is created automatically.

The optional legacy Vercel uploader is not part of the default workflow; it requires installing `@vercel/blob` separately and setting `BLOB_READ_WRITE_TOKEN` in the shell environment.

Before a release, update the version with `npm version patch --no-git-tag-version`, validate the build, and commit the manifest and lockfile together. Building does not upload files unless you explicitly run `upload` or `publish`.

## Troubleshooting

- **`swiftc` missing:** install Xcode Command Line Tools, then rerun the command.
- **Fn does nothing / `tap_create_failed`:** check Accessibility permission, restart Electron, and recompile with `npm run build:fn`.
- **Microphone fails:** check Microphone permission and the selected input device.
- **Text does not paste:** focus an editable field and check Accessibility/Automation permissions.
- **API errors:** verify the key, provider account quota, and configured models in Provider settings. Model defaults are in `store.js`.
- **Native module or CPU mismatch:** run `npm ci` and `npm run build:fn` on the target Mac; do not copy `node_modules` between architectures.
