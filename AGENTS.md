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

- **Repository**: Pure async DB queries via Drizzle ORM accepting optional `client: DbClient = db` (`typeof db | Tx`).
- **Service & `catchError`**: Business logic, validations, and transactions (`db.transaction(async (tx) => { ... })`) live in services. Wrap async calls with `const [err, data] = await catchError(...)`. Throw standard 3-property `createError({ statusCode, statusMessage, message })` directly (`statusMessage` for short category, `message` for user-facing detail).
- **Thin Controllers**: Event handlers in `server/api/v1/*` validate request data, enforce auth guards, and return service calls directly: `return await MyService.method(...)`.
