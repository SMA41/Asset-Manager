# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### `finance-tracker` — AI Finance Tracker (Expo, mobile + web)
Production-style mobile finance app for small business owners.
- **Stack**: Expo SDK 54, expo-router (typed routes), TypeScript, react-native-svg, Firebase JS SDK (Auth + Firestore), Gemini 2.0 Flash via REST.
- **Features**: email/password auth, products CRUD with stock, sales (atomic Firestore transaction decrements stock + records profit), expenses with categories and per-month filtering, monthly budget with overspend warnings, dashboard with revenue chart + category breakdown + top products, AI chat assistant grounded on a live finance snapshot, AI-generated month-end reports persisted to Firestore.
- **Theme**: dark + light, fintech aesthetic (Coinbase/Robinhood-inspired) with emerald primary.
- **Navigation**: bottom tabs (Overview, Products, Sales, Expenses, Assistant). Auth gate redirects between `(auth)` and `(tabs)` based on Firebase auth state.
- **Env vars** (all `EXPO_PUBLIC_*` so they're inlined at build time): Firebase web config (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`) + `EXPO_PUBLIC_AI_API_KEY` for Gemini.
- **Firestore layout**: `users/{uid}/{products|sales|expenses|budgets|ai_reports|ai_chat}`.
