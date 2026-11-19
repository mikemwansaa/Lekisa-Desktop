# Lekisa for Windows

Desktop version of Lekisa. It runs the **same logic and the same Supabase backend** as the mobile app
(login, encrypted offline vault, auto-lock, sync, Lekisa AI, Money Match), with a desktop layout:
sidebar, breadcrumb top bar, Ctrl+K search, tabbed pages and a records table.

## How it shares code with mobile
`scripts/sync-core.js` reads your mobile project (`app.js`, plus the styles and the lock / "Welcome back" screen from `index.html`) and writes
`desktop/core.js`, `desktop/mobile-base.css` and `desktop/index.html` (from `index.template.html`). Lekisa AI, login, the lock screen, sync and Money Match all come from the mobile code. The mobile files are never changed.
Fix a bug in the mobile `app.js`, run `npm run sync`, and the desktop gets the fix.
Only `desktop/desk.js` and `desktop/desk.css` are desktop-specific.

## Run it
```
npm install
npm run sync -- ../lekisa-pilot    # path to your mobile project (skip if desktop/core.js is already there)
npm start
```

## Build the .exe
**On Windows:** `npm run dist`. The installer appears in `dist/Lekisa-Setup-<version>.exe`.

**On GitHub (no local build):**
1. Push this folder to a GitHub repo (commit `desktop/core.js`, so CI works without your mobile repo).
2. Optional: to rebuild core from your mobile repo in CI, set repository variable `MOBILE_REPO` (`owner/repo`)
   and, if it is private, secret `MOBILE_TOKEN` (a token that can read it).
3. Actions tab, "Build Lekisa for Windows", Run workflow (or push a tag such as `v2026.11.3`).
   Download the installer from the run's Artifacts (tags also attach it to a Release).

The installer is unsigned, so Windows SmartScreen shows "Windows protected your PC". Choose More info, then Run anyway.
A code-signing certificate removes this later.

## Shortcuts
Ctrl+K search, Ctrl+B collapse sidebar, N record a sale, E add an expense (when not typing in a field).

## Differences from mobile
- No voice input in Lekisa AI on desktop (browser speech recognition is not available in Electron). Typing works.
- The offline vault is per device. Records sync through Supabase; unsynced offline entries stay on the device that made them.
- Locks after 2 minutes of inactivity, and when the window is minimised or hidden, same as mobile. This can be turned off in Settings > App lock (the same setting as mobile); then the passphrase is asked only when the app is opened.
- Updating means installing a new .exe.

## Before you ship
Test one full cycle against the real backend: log in, record a sale, correct it, reverse an expense, export CSV, lock/unlock, log out.
