# Tutine
---
## A Todo app designed for Tudor Bufnila 
I operate on given routines and was getting tired setting up daily todos. So I churned out this app with a few tokens to save me that time.

1. Create routines for the week.
2. Select routine.
3. Follow it.
---
## Installation
Download the latest build for macOS (`.dmg`), Windows (`.msi` / `.exe`) or Linux (`.deb`, `.rpm`, `.AppImage`) from the [Releases](../../releases/latest) page.

### Build from source
1. Git clone the repo
2. Open in terminal
3. `yarn install && yarn tauri build`

---
## Releases
Every push to `main` builds all platforms and publishes a new GitHub release, bumping the patch version (`0.1.N`).
Include `[minor]` or `[major]` in a commit message to bump that part instead.

Builds are unsigned. On macOS, run `xattr -cr /Applications/Tutine.app` (or right-click → Open) on first launch; on Windows, choose "More info → Run anyway" in SmartScreen.

---
## License
Copyright (C) 2026 Tudor Bufnila

Licensed under the [GNU General Public License v3.0 or later](LICENSE). Any fork or redistributed version, modified or not, must also be released as open source under the GPL.
