# UnTube — Self-Hosted YouTube Channel Downloader & Viewer

A Docker-based web application that lets you follow YouTube channels, automatically download their videos, and watch them in a clean, ad-free interface — all on your own hardware.

![UnTube feed](screenshots/untube%20feed.png)

## Screenshots

![UnTube feed](screenshots/untube%20feed.png)

## Features

- **Channel Management** — Add channels by URL, `@handle`, or channel ID
- **Auto Downloads** — Background scheduler polls for new videos at a configurable interval
- **Quality Control** — Per-channel quality overrides (360p to 4K or best available)
- **Skip Shorts** — Optionally skip YouTube Shorts (videos under 60 seconds)
- **Auto-Delete** — Automatically remove videos older than X days (global or per-channel)
- **Built-in Player** — HTML5 video player with HLS/transcoded stream support and CC subtitles
- **Feed View** — All videos sorted by newest first, filterable by channel
- **Push Notifications** — Optional Apprise-based notifications on new downloads
- **Mobile-Friendly** — Responsive layout optimised for phone/tablet use
- **Persistent Storage** — Everything saved to local Docker volumes

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Run

```bash
git clone https://github.com/tomfriart/untube.git
cd untube

docker compose up -d --build

# Open in your browser
open http://localhost:3987
```

### Stop

```bash
docker compose down
```

## Architecture

```
untube/
├── docker-compose.yml          # Orchestrates frontend + backend
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app.py                  # Flask API + yt-dlp + APScheduler
├── frontend/
│   ├── Dockerfile              # Multi-stage: Vite build → nginx
│   ├── nginx.conf              # Reverse proxy for API + media
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── icons.jsx
│       ├── styles.js
│       ├── utils.js
│       └── components/
├── data/                       # Auto-created: SQLite database + thumb cache
└── downloads/                  # Auto-created: downloaded video files
    ├── ChannelName1/
    │   ├── videoId1.mp4
    │   └── videoId2.mp4
    └── ChannelName2/
        └── videoId3.mp4
```

## Configuration

All settings are adjustable from the **Settings** panel in the UI:

| Setting            | Default  | Description                                         |
|--------------------|----------|-----------------------------------------------------|
| Quality            | 720p     | Video download resolution (360p–4K or best)         |
| Skip Shorts        | On       | Don't download videos under 60 seconds              |
| Check Interval     | 30 min   | How often to poll channels for new uploads          |
| Auto-Delete        | Off      | Remove videos older than N days                     |
| Notifications      | Off      | Apprise URL for push notifications on new downloads |

Per-channel overrides for quality and auto-delete are available from each channel's settings.

## Custom Downloads Path

By default videos are saved to `./downloads/` next to the `docker-compose.yml`. To point at an existing media library, edit the backend volume in `docker-compose.yml`:

```yaml
volumes:
  - /your/media/path:/app/downloads
```

## API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/channels`             | List all followed channels         |
| POST   | `/api/channels`             | Add a channel `{ url: "..." }`     |
| DELETE | `/api/channels/:id`         | Remove a channel + its videos      |
| GET    | `/api/videos`               | List all videos (newest first)     |
| GET    | `/api/videos?channel_id=X`  | Filter by channel                  |
| GET    | `/api/settings`             | Get current settings               |
| PUT    | `/api/settings`             | Update settings                    |
| POST   | `/api/check-now`            | Trigger immediate check            |
| GET    | `/media/:filepath`          | Serve a downloaded video file      |
| GET    | `/api/stream/:video_id`     | HLS transcode stream               |

## Troubleshooting

- **Videos not downloading?** Check backend logs: `docker compose logs backend`
- **yt-dlp errors?** The YouTube extractor updates frequently — rebuild: `docker compose build --no-cache backend`
- **Disk space?** Monitor `./downloads/` — higher quality = bigger files; enable auto-delete in Settings

## Tech Stack

- **Backend** — Python, Flask, yt-dlp, APScheduler, SQLite
- **Frontend** — React 18, Vite, hls.js
- **Serving** — nginx (reverse proxy + static files)
- **Packaging** — Docker Compose

## License

MIT
