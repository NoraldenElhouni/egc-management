# AGENTS.md

This repo is an Electron + React + TypeScript app for EGC management, backed by Supabase.

## Project map

- App entry points: `src/main.ts`, `src/renderer.ts`, `src/index.tsx`
- UI and screens: `src/components/`, `src/pages/`
- Data hooks: `src/hooks/`
- Shared types and schemas: `src/types/`
- Supabase client and generated types: `src/lib/supabase.ts`, `src/lib/supabaseClient.ts`
- Environment config: `forge.config.ts`, `vite.*.config.ts`, `tailwind.config.js`
- Project docs: [readme.md](readme.md)

## Working conventions

- Prefer TypeScript and existing project patterns over introducing new abstractions.
- Keep feature logic in hooks and UI rendering in components; use existing type definitions where they already exist.
- Form flows usually combine `react-hook-form` + Zod validation in `src/types/schema/*` and component-level form usage.
- When the app talks to Supabase, follow the generated table contracts in `src/lib/supabase.ts` and avoid inventing fields that are not present in the DB schema.
- For project creation flows, inspect both the hook and the form together before changes: `src/hooks/useProjects.ts` and `src/components/project/form/newProjectForm.tsx`.

## Commands

- Start app: `npm run start`
- Lint: `npm run lint`
- Regenerate Supabase types: `npm run types`
- Package / build desktop app: `npm run package` or `npm run make`

## Critical repo-specific notes

- `npm run types` is not a generic TypeScript compile; it regenerates `src/lib/supabase.ts` from the linked Supabase schema. Run it after schema changes.
- This project uses Electron Forge with Vite, so desktop startup/build behavior differs from a browser-only React app.
- A lot of domain logic is organized by feature area (finance, hr, project, shop, etc.), so prefer matching the local feature pattern instead of creating a new cross-cutting pattern.
- Be careful with nullable DB values and date serialization when working with Supabase insert/update payloads.

## Before finishing a change

- Verify the relevant behavior with the smallest available command: usually `npm run lint` and, if the change touches Supabase schema or types, `npm run types`.
- Keep patch scope narrow and aligned with the existing feature structure.
- If you must add new schema or contracts, update the matching generated types or the DB model in the same change.
