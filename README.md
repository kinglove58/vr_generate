## License

This project is licensed under the MIT License.

# Automated Scouting Report Generator

Backend + core logic for Category 2, built on GRID Open Access data.

## Setup

1. Create `.env.local`:

```bash
GRID_API_KEY="YOUR_GRID_API_KEY"
GRID_CENTRAL_URL="https://api-op.grid.gg/central-data/graphql"
GRID_STATS_URL="https://api-op.grid.gg/statistics-feed/graphql"
OPENAI_API_KEY="YOUR_OPENAI_KEY"
OPENAI_MODEL="gpt-5-nano"
```

2. Install deps and run dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/app to generate reports.

## API

Generate scouting report:

```bash
curl -X POST http://localhost:3000/api/scouting-report \
  -H "Content-Type: application/json" \
  -d '{"title":"val","opponentTeamName":"G2","lastXMatches":5}'
```

Search teams:

```bash
curl "http://localhost:3000/api/teams/search?q=G2&limit=5"
```

Series by tournament name (contains):

```bash
curl "http://localhost:3000/api/series/by-tournament?titleId=6&tournament=Champions&first=20"
```

Capabilities:

```bash
curl "http://localhost:3000/api/capabilities"
```

## Notes

- All GRID calls are server-side only.
- Caching is enabled (5 min for central, 15 min for stats).
- Rate limiting is in-memory and per-IP for demo use.
