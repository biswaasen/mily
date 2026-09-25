# Security

Please report vulnerabilities privately to the maintainer through GitHub's private vulnerability reporting feature if it is enabled for this repository. If that option is unavailable, open an issue asking for a private reporting channel without including exploit details or sensitive data.

Include affected versions, reproduction steps, impact, and a proposed fix when possible. Never attach real API keys, recordings, transcripts, or signing credentials. There is no guaranteed response time or formal support window; fixes are focused on the current source revision.

Mily processes microphone audio through an external provider, stores its API key and history locally without application-level encryption, uses the clipboard, and needs macOS Accessibility/Automation permissions. The current Electron renderers have Node integration enabled. Load only trusted bundled UI content and review changes to IPC handlers, external navigation, system commands, and update feeds carefully.

## Known dependency limitation

After compatible updates, `npm audit` still reports two high-severity findings in Electron's development-time download/extraction dependency chain (`electron` → `extract-zip`). The installed Electron 39 line has no compatible fix reported by npm; the suggested remediation upgrades Electron to a new major version. These dependencies are not shipped as application runtime dependencies, but the findings matter during installation. Review the [upstream advisory](https://github.com/advisories/GHSA-jmr9-qjv8-65gv) and validate an Electron major upgrade separately before claiming a clean audit.
