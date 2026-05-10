# Changelog

## [1.2.0] - 2026-05-10
### Added
- One-off download — download any YouTube URL without adding a channel, pinned as "Uncategorized" in the sidebar
- Export / import backup from System settings (downloads the SQLite database as a `.db` file)
- Real uploader name and avatar fetched for Uncategorized / one-off downloads
- Video recommendations panel ("Videos you may like") shown in the player sidebar
- "More from [channel]" section in the player sidebar when more videos are available

### Changed
- Sidebar always shows "Uncategorized" pinned at the bottom when one-off downloads exist
- Player sidebar hides "More from" when the channel has no other videos and falls back to recommendations

## [1.1.0] - 2026-05-07
### Added
- Per-channel quality overrides
- Per-channel auto-delete overrides
- Subtitle / CC toggle in the video player
- Push notifications via Apprise
- HLS transcode stream support
- Pull-to-refresh on mobile
- New badge for unread/unwatched videos
- Mobile-friendly settings navigation

### Changed
- Default check interval increased to 180 minutes

## [1.0.0] - Initial release
### Added
- Channel management (add/remove by URL or @handle)
- Automatic video downloads via yt-dlp
- Quality selection (360p to 4K or best)
- Skip Shorts option
- Auto-delete videos after X days
- Built-in HTML5 video player
- Feed view filterable by channel
- Settings panel
- Docker Compose setup
