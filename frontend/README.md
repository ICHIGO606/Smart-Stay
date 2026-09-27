# SmartStay Frontend

The frontend is a React single-page application for browsing hotels and travel packages, making bookings, managing user profiles, and administering hotel, room, package, booking, and verification data.

## Requirements

- Node.js 22 or newer
- npm
- The SmartStay backend running at `http://localhost:8000`

## Install and run

From `frontend/`:

```sh
npm ci
npm run dev
```

Vite serves the application at `http://localhost:3000`. The API client currently uses `http://localhost:8000/api/v1` in `src/services/api.js`; keep the backend URL and its allowed CORS origins aligned when changing local ports.

## Scripts

| Command                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start Vite with hot module replacement.                |
| `npm run build`        | Create a production build in `dist/`.                  |
| `npm run preview`      | Preview the production build locally.                  |
| `npm test`             | Run Vitest tests and generate coverage.                |
| `npm run lint`         | Lint frontend source and tests.                        |
| `npm run format`       | Format frontend JavaScript, JSX, and CSS under `src/`. |
| `npm run format:check` | Check formatting without modifying files.              |

The current coverage gate measures the frontend service layer and enforces at least 50% for statements, branches, functions, and lines. It does not measure every React page or component.

## Main areas
