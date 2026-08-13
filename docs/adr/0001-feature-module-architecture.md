# ADR 0001: Feature Module Architecture & Conventions

- **Status**: Accepted
- **Date**: 2026-08-13

## Context

Previously, feature modules under `app/features/` lacked strict architectural guidelines. Code was written inconsistently:
1. Utility and formatter functions (e.g. `formatRupiah`, `formatDate`) were duplicated locally inside individual `.vue` components.
2. `useFetch` calls explicitly passed generic type parameters (e.g., `useFetch<SaldoResponse>`), overriding Nuxt 3's built-in server route type inference.
3. Table column definitions (`TableColumn<T>[]`) were embedded inside Vue components instead of being centralized.
4. Input validation schemas (Zod schemas) were missing or scattered instead of being exported from `model.ts`.

## Decisions

To enforce clean code, consistency, and type safety across all `app/features/*` modules, agents and developers MUST follow these 3 rules:

### 1. Utility & Formatter Functions (`app/utils/`)
- All utility and formatting functions (e.g., `formatRupiah`, `formatDate`, `formatDateShort`) MUST be placed in `app/utils/`.
- Vue components MUST import formatters from `~/utils/formatter` (or relevant `app/utils/` files).
- **Prohibited**: Redefining or inlining formatting functions inside `.vue` components.

### 2. Type Inference & Component Props
- **No Explicit `useFetch` Generics**: Do NOT pass explicit generic types to `useFetch` (e.g., `useFetch<MyType>("/api/...")`) when calling Nuxt server routes. Nuxt 3 automatically infers return types from `/server/api/...` endpoints.
- **Component Props Scope**: Component `props` interface definitions MUST be declared inside the component `.vue` file itself (`<script setup lang="ts">`), not in `model.ts`.
- **No Redundant Interfaces**: Avoid declaring custom interfaces in `model.ts` if Nuxt or Zod can infer them.

### 3. Structure of `model.ts`
Each feature directory (`app/features/<feature-name>/model.ts`) is the single source of truth for feature-level models:
- **Table Column Definitions**: All `TableColumn<T>[]` configurations MUST be defined and exported in `model.ts`. Components import these columns and use template slots for custom cell rendering.
- **Zod Schemas & Inferred Types**: All form validation schemas (e.g. `setoranSchema`, `penarikanSchema`) and their inferred types (`z.infer<typeof ...>`) MUST be defined and exported in `model.ts`. Modal/Form components MUST use these schemas for input validation.

## Consequences

- Consistent architecture across all feature modules (`simpanan`, `master-saham`, `master-akun`, `jurnal`, etc.).
- Improved developer & agent experience when navigating, refactoring, or extending features.
- Prevention of duplicate logic, stale types, and fragmented validation rules.
