# The B-Side Archive

An immersive, responsive golden-era Hindi radio built with Next.js.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

> An internet connection is required for playback because songs are streamed from official YouTube label and YouTube Music Topic sources. No copyrighted music files are bundled.

## Included

- Cinematic desktop and mobile art direction using the supplied layouts
- 60 full-length, browsable Hindi classics from 1951–1979
- Visible YouTube player with custom play, pause, next, previous, seek, volume, shuffle and repeat controls
- Verified embeddable official label / YouTube Music Topic sources for all 60 records
- Always-moving dust particles, film grain, scratches, light leaks and spinning vinyl
- Search by title, singer, film or year, plus decade and favorites filters
- Queue, persistent favorites, station cards and song requests
- Session-based APIs with validation, request throttling, atomic local writes and a health endpoint

## Backend routes

- `GET /api/radio` — station, 60-song catalog, sources and current programming
- `GET|POST /api/favorites` — anonymous session favorites
- `POST /api/requests` — validated, rate-limited record requests
- `GET /api/health` — service health

## Music-source note

Playback uses official YouTube sources and remains subject to YouTube's terms, regional availability and the source owners' settings. The source catalog lives in `lib/youtube-sources.js`; replace an ID there if a rights holder changes an upload.

The included JSON repository is appropriate for this self-contained preview. For multi-instance deployment, replace `lib/store.js` with Postgres/Redis while preserving the API contract.
