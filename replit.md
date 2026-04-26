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
Production-style mobile finance app for small business owners with a free + Pro plan.
- **Stack**: Expo SDK 54, expo-router (typed routes), TypeScript, react-native-svg, Firebase JS SDK (Auth + Firestore), Gemini via REST.
- **Free features**: email/password auth, products CRUD with stock, sales (atomic Firestore transaction decrements stock + records profit), expenses with categories and per-month filtering, monthly budget with overspend warnings, dashboard with revenue chart + category breakdown + top products, AI chat assistant grounded on a live finance snapshot, AI-generated month-end reports persisted to Firestore.
- **Pro features** (`PlanContext` toggle): customer manager, invoice generator with line items / tax / due dates, pending payments tracking, AI payment reminders, advanced analytics (top sellers, 6-month trends, profit margins per product), AI restock advisor, bulk product import (paste CSV format), Pro-gated dashboard insights panel.
- **Theme**: modern blue palette (light primary `#2563EB`, dark navy `#0B1220` with primary `#3B82F6`). Charts use blue/sky/violet/cyan/amber.
- **Navigation**: 5 bottom tabs (Overview, Products, Sales, Expenses, Pro). Pro tab is the upgrade hub + feature launcher. Assistant lives at `/assistant` (top-level route, accessible from dashboard header + Pro tab + AI report quick action). Auth gate redirects between `(auth)` and `(tabs)` based on Firebase auth state.
- **Env vars** (all `EXPO_PUBLIC_*`): Firebase web config + `EXPO_PUBLIC_AI_API_KEY` for Gemini.
- **Firestore layout**: `users/{uid}/{products|sales|expenses|budgets|ai_reports|ai_chat|customers|invoices|profile}`. Plan stored at `users/{uid}/profile/info` with `{plan: "free"|"pro", upgradedAt}`.
