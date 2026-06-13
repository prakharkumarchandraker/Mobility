# Life OS

Personal Train / Skin / Diet / Routine tracker. Single-file PWA, works offline, all data stored on your device.

## Files
- `life-os.html` — the whole app (open this)
- `manifest.json` — PWA metadata (name, icons)
- `service-worker.js` — offline caching + reminder notifications
- `icon-192.png`, `icon-512.png` — app icons

## Host on GitHub Pages (free)
1. Create a new repo (e.g. `life-os`).
2. Upload all 5 files to the repo root.
3. Repo **Settings → Pages → Source: main branch / root → Save**.
4. After a minute it is live at `https://<your-username>.github.io/life-os/life-os.html`.
5. Open that link in **Chrome** on your phone → menu (⋮) → **Add to Home screen / Install app**.

Now it opens fullscreen with its own icon, works offline, and reminders work best-effort while installed.

## Notes
- All progress is saved in your browser/app storage on the device. Use **Progress → Export** regularly to back up (and Import to restore or move to a new phone).
- Notifications are local/best-effort. Phones aggressively kill background timers, so a fully-closed app may delay them. Keeping it installed helps.
