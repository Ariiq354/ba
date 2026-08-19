## Package Manager & Tooling

This project strictly uses **Bun** as its package manager and script runtime.

- **Package Manager**: Always use `bun` (never `npm`, `pnpm`, or `yarn`).
  - Install dependencies: `bun install` / `bun add <pkg>`
  - Run scripts: `bun run dev`, `bun run check` (typecheck), `bun run lint` (ESLint), `bun test`

## Agent skills

### Issue tracker

Issues are tracked on GitHub via GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context documentation layout (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.

### Feature Architecture Rules

Feature modules (`app/features/*`) must strictly adhere to ADR 0001 (`docs/adr/0001-feature-module-architecture.md`):

- **Utils**: All formatters/helpers must be in `app/utils/` (no inline formatters in `.vue`).
- **Inference**: Do not pass explicit generic types to `useFetch` (Nuxt auto-infers return types). Keep component `props` types in `.vue` files.
- **Model**: Put table columns (`TableColumn<T>[]`) and Zod schemas in `app/features/<feature-name>/model.ts`.
- **DataTable**: Feature containers must use `DataTable.vue` (`~/components/table/DataTable.vue`) directly instead of creating single-use table wrappers.

### Server Architecture Rules

Server modules (`server/modules/*`) and API endpoints (`server/api/*`) must strictly adhere to ADR 0002 (`docs/adr/0002-server-module-architecture.md`):

- **Repository**: Pure DB queries with `Effect.fn("Repo.method")((...) => Effect.tryPromise({ try: async () => ..., catch: (error) => ... }))`. Paging returns `{ total, data }`. Catch DB unique violations via `isUniqueViolation(error)` (`~~/server/utils/pgcode`) to return typed domain errors. Encapsulate `db.transaction` inside repo for single-repo operations (no `tx` param). Parameter `tx` (`tx = db`, inferred without explicit type annotations) is ONLY present on methods participating in multi-step transactions orchestrated by service.
- **Service & Effect Generators**: Business logic, validations, and orchestration live in services using `Effect.fn("Service.method")(function* (...) { ... })` and `yield*`. Direct single repo mutations via `yield* Repo.method(...)` and manage `db.transaction` only for multi-step orchestrations. Throw typed errors (`new ItemNotFoundError({ id })`, domain `TaggedError`).
- **Thin Controllers**: Event handlers in `server/api/v1/*` validate request data, enforce auth guards, and pipe service calls through `Effect.catchTags({...})` to standard 3-property `createError({ statusCode, statusMessage, message })`, terminating with `Effect.runPromise`.
