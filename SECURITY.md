# Security Policy

## Disclaimer

Orqa Note is an open-source desktop application provided **"as is"**, without warranty of any kind, as stated in the [MIT License](./LICENSE). It is maintained on a best-effort basis by volunteers. Use of this software is at your own risk.

Orqa Note runs locally on your machine and reads/writes files from directories you select. It also embeds third-party web services (e.g. Google Docs, Figma) via `<webview>` — you are responsible for reviewing the terms, privacy policies, and security practices of any external service you connect to.

No guarantee is made regarding:

- Fitness for any particular purpose (including handling confidential, regulated, or mission-critical data).
- Availability of updates or security patches.
- Compatibility with any specific operating system version or hardware.

## Supported Versions

Only the **latest released version** receives security updates. Older versions are not supported.

| Version | Supported |
| ------- | --------- |
| Latest release (`main`) | ✅ |
| Older versions | ❌ |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in Orqa Note, please **do not** open a public GitHub issue.

Instead, report it privately via GitHub's [Private Vulnerability Reporting](https://github.com/ariefrizkyr/orqa-note/security/advisories/new) feature, or email the maintainer at **ariefrizkyr@gmail.com**.

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce (proof-of-concept code, screenshots, or a minimal repro repo if possible).
- The version/commit of Orqa Note affected.
- Your operating system and Node/Electron versions.

You can expect an initial acknowledgement within **7 days**. We will work with you to validate the issue, coordinate a fix, and credit you in the release notes if desired.

## Scope

In scope:

- Code in this repository (`apps/`, `packages/`).
- Release artifacts published from this repository.

Out of scope:

- Vulnerabilities in third-party dependencies — please report those upstream. If the issue is in how Orqa Note *uses* a dependency, it is in scope.
- Vulnerabilities in embedded third-party services (Google, Figma, etc.).
- Social engineering, physical attacks, or issues requiring an already-compromised machine.
