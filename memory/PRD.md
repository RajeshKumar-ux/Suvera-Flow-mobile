# Suvera FLOW — Mobile (Expo) PRD

## Original problem statement
A native Android + iOS Expo app called "Suvera FLOW" for visitor queue management. It serves IT Admin, Reception, MD and custom meeting persons (e.g. Finance Head). It is a client only and connects to the existing FastAPI backend at EXPO_PUBLIC_API_URL=https://suveraflow.in. No local DB or business logic. The full spec covers auth with secure-store, role routing, GET /api/queue/state driving every screen, WS /api/ws refresh, a 20s poll plus refresh on foreground, queue actions, availability, people management, history, photos, push and the Suvera palette. Later the user supplied a logo and set the primary color to #1A2F5A.

## User choices
- Push: build the registration code now; it can only be tested after Publish and a native build
- Backend: reported as live
- WS auth: `?token=` query param

## Architecture
- No backend in this repo. Everything calls `EXPO_PUBLIC_API_URL`
- `src/api.ts`: fetch client with Bearer auth, `detail` extraction and a 401 handler that re-logs in
- `src/auth.tsx`: token and user stored in secure storage; routes by role
- `src/queue.ts`: queue-state query (20s poll), defensive readers and the actions hook. No optimistic updates and no client sorting
- `src/LiveSync.tsx`: WebSocket with reconnect, host_id filter for md/host users, foreground refetch and push deep links
- `src/push.ts`: "visitors" channel (HIGH, sound), POST/DELETE `/api/push/devices`; `PushPrompt` explains notifications before asking for permission
- Routes:
  - /login
  - /console (Home, Requests, Queue, Status)
  - /reception (Today, Availability, History)
  - /admin (Overview, People, Control, Queue)
  - /history and /audit as stacked screens

## Implemented (2026-06)
- All role screens, reason sheet, status editor with ISO available_from, people CRUD (Others → host + role_label), photos with an auth header
- Logo and #1A2F5A branding, Manrope / DM Sans / JetBrains Mono fonts

## Known blockers
- suveraflow.in returns Cloudflare 1001 and a TLS handshake failure, so logged-in screens are untested against live data
- Audit endpoint path was assumed to be GET /api/admin/audit

## Backlog
- P0: verify response shapes once the backend is reachable
- P1: filter history by range, search visitors
- P2: tablet layout for the reception desk
