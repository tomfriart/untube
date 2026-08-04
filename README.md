# UnTube — Self-Hosted YouTube Channel Downloader & Viewer

---

### 🔒 For Local Network Use Only

> **This application is not designed or intended to be run on a public-facing URL.**
> There is no authentication, no user management, and no security hardening.
> **Run it exclusively on your local network or behind a VPN. Do not expose it to the internet.**

---

### ⚠️ Disclaimer

This project was built **entirely through AI prompting** using [Claude](https://claude.ai) — no manual code was written by the author. AI can and does make mistakes, and this application is not perfect. **Bugs should be expected.**

The author does not take any credit for the features and technologies that make UnTube function — all credit goes to the open-source projects this app is built on: [yt-dlp](https://github.com/yt-dlp/yt-dlp), [Flask](https://flask.palletsprojects.com/), [React](https://react.dev/), and others.

You are free to modify, improve, and adapt this project in any way you like. **Use at your own risk.**

A Docker-based web application that lets you follow YouTube channels, automatically download their videos, and watch them in a clean, ad-free interface — all on your own hardware.

![UnTube feed](screenshots/untube%20feed.png) <img src="screenshots/untube feed mobile.png" width="200"/>

[View all screenshots](screenshots/)

## Features

- **Channel Subscriptions** — Add YouTube channels, auto-check for new videos on a schedule
- **Custom Video Player** — Built-in player with seek bar, chapters, playback speed, quality selection, subtitles, SponsorBlock integration, and storyboard seek previews
- **Playlists** — Create and manage playlists, auto-advance to next video
- **Continue Watching** — Tracks watch progress across sessions
- **Tags & Filtering** — Organize channels with tags, filter the feed by channel, tag, or watched status
- **Download Queue** — Queue videos for download, auto-downloads new uploads
- **SponsorBlock** — Skip sponsor segments, intros, outros, and more
- **Settings** — Configurable download paths, playback defaults, appearance (dark/light theme, card density), and system management
- **Mobile Friendly** — Responsive design with touch-optimized player controls

## Quick Start

```bash
git clone https://github.com/tomfriart/untube.git
cd untube
docker compose up -d --build
```

Access at http://<your ip>:3987

## First Time Setup

- Data is stored in `./data/` (SQLite database, thumbnails, storyboards)
- Downloads are stored in `./downloads/`
- Both directories are created automatically on first run

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `/app/data` | Data directory |
| `DOWNLOADS_DIR` | `/app/downloads` | Downloads directory |
| `UNTube_API_KEY` | _(empty)_ | API key for authentication (leave empty to disable) |
| `UNTube_MAX_UPLOAD_MB` | `50` | Maximum upload size in MB |

## Tech Stack

- **Backend** — Python 3.11, Flask, yt-dlp, APScheduler
- **Frontend** — React 18, Vite, hls.js
- **Serving** — Nginx (reverse proxy + static files)
- **Packaging** — Docker Compose
- **Database** — SQLite

## Troubleshooting

- **Videos not downloading?** Check logs: `docker compose logs untube`
- **yt-dlp errors?** YouTube frequently changes its internals, which breaks yt-dlp. This is the most common source of issues and is outside this project's control. When it happens, rebuild the image to get the latest yt-dlp: `docker compose build --no-cache` (or `docker pull tomfriart/untube:latest` if using Docker Hub). Expect this to be needed every few weeks.
- **Disk space?** Monitor `./downloads/` — higher quality = bigger files; enable auto-delete in Settings

## Backup

Back up your data directory before upgrading:
```bash
cp -r data/ backups/$(date +%Y%m%d)/
```
