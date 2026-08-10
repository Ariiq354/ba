# Domain Documentation & Architecture Decision Records (ADRs)

This repository uses a **single-context** domain documentation layout.

## Documentation Structure

- **Context File**: `CONTEXT.md` at the repository root contains the core system domain, high-level concepts, architectural summary, and context boundaries.
- **ADRs Directory**: `docs/adr/` contains Architecture Decision Records detailing key design decisions.

## Consumer Rules for Agents

1. **Before non-trivial tasks**: Check `CONTEXT.md` at the repo root to understand system domain, entities, and conventions.
2. **Architecture Decisions**: When proposing or making significant structural/architectural changes, consult existing ADRs in `docs/adr/` and write new ADRs in `docs/adr/YYYY-MM-DD-short-title.md` when appropriate.
