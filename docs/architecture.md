# Pulse architecture

## Overview

Pulse is a pnpm monorepo with a React SPA (`apps/web`), Express + Socket.IO API (`apps/api`),
shared Zod contracts (`packages/shared`), and shared TS configs (`packages/config`).

## Frontend

Feature-Sliced Design layers:

- `app` — providers, router, i18n, theme
- `pages` — route compositions
- `widgets` — shell, sidebar, message area, thread panel
- `features` — auth, composer, search, notifications, command palette
- `entities` — workspace, channel, conversation, message
- `shared` — UI kit, API client, socket helpers

Access tokens live in Zustand memory only. Refresh tokens are httpOnly cookies.

## Backend

Domain modules expose routes → services → Prisma. Authorization is enforced on the server
for every mutating and sensitive read operation.

## Real-time

Socket.IO authenticates with the access JWT, then joins rooms:

- `workspace:{id}`
- `channel:{id}`
- `conversation:{id}`

REST mutations emit socket events so all connected clients stay in sync.
