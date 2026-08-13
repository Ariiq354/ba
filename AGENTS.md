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

