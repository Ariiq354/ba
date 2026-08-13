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

- **Neverthrow Inference**: Use `errAsync({ code: "...", message: "..." } as const)`. Do NOT create manual explicit error interface types; rely on end-to-end implicit TypeScript type inference.
- **Drizzle Transactions**: Throw `new Error("CODE: message")` inside `db.transaction(...)` for automatic rollback and ESLint `no-throw-literal` compliance. Map cause to `{ code: "CODE", message: "..." } as const` in `fromPromise(..., cause => ...)`.
- **API Error Matching**: Event handlers in `server/api/v1/*` must consume service calls with `.match(data => data, (err) => { switch (err.code) { ... } })` mapping domain error codes to HTTP status codes via `createError()`.
