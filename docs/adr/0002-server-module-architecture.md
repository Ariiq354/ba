# ADR 0002: Server Module & API Architecture Conventions

- **Status**: Accepted (Updated 2026-08-16: Migrated from Neverthrow to standard Go-style `catchError` tuple + Service `createError` pattern)
- **Date**: 2026-08-13 (Revised 2026-08-16)

## Context

Previous server architecture relied on `neverthrow` (`ResultAsync`, `.match()`), which introduced excessive verbosity and boilerplate in service methods and API endpoint handlers.

## Decisions

To enforce clean separation of concerns, explicit error reporting, and lightweight API controllers across all server code (`server/modules/*` and `server/api/*`), developers and agents MUST adhere to these conventions:

### 1. Module Layering (Repo, Service, API)

- **Repository (`server/modules/<module>/repo.ts`)**:
  - Pure database calls via Drizzle ORM returning Promises.
  - No HTTP or business logic exceptions thrown in Repo (only DB interactions).
  - All Repo functions accept an optional `client: DbClient = db` parameter (where `DbClient = typeof db | Tx`) so transactions can be orchestrated cleanly from the Service layer.

- **Service (`server/modules/<module>/service.ts`)**:
  - Encapsulates all business logic, validation, and multi-step transaction orchestration (`db.transaction(async (tx) => { ... })`).
  - Wraps async calls with `const [err, data] = await catchError(promise)` (`server/utils/error.ts`).
  - Directly throws `createError({ statusCode, statusMessage })` on domain validations or database failures with explicit context and HTTP status codes (400, 404, 403, 500).

- **API Endpoints (`server/api/v1/*`)**:
  - Thin controllers that extract & validate inputs (`readValidatedBodySafe`, `getValidatedQuerySafe`), enforce authentication (`authGuard`, `adminGuard`), and return service calls directly: `return await MyService.method(...)`.
  - Nuxt / H3 automatically handles errors thrown by `createError()` from services.

### 2. Standard `catchError` Usage in Service Layer

```ts
import { createError } from "h3";
import { catchError } from "~~/server/utils/error";
import { MyRepo } from "./repo";

export const MyService = {
  async getById(id: number) {
    const [err, item] = await catchError(MyRepo.findById(id));
    if (err) {
      console.error(`Gagal mencari data ID ${id}:`, err);
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil data",
      });
    }

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Data tidak ditemukan",
      });
    }

    return item;
  },
};
```

### 3. Transaction Orchestration in Service Layer

```ts
const [txErr, result] = await catchError(
  db.transaction(async (tx) => {
    // Pass `tx` as client to repo methods
    const item = await MyRepo.findById(id, tx);
    if (!item) {
      throw createError({ statusCode: 404, statusMessage: "Item not found" });
    }
    return await MyRepo.update(id, data, tx);
  }),
);

if (txErr) {
  if ("statusCode" in (txErr as any)) {
    throw txErr;
  }
  console.error("Gagal menjalankan transaksi:", txErr);
  throw createError({
    statusCode: 500,
    statusMessage: "Gagal memproses transaksi",
  });
}
```

## Consequences

- Direct, clean, and concise API handlers without verbose `.match()` blocks.
- Full type inference for Nuxt auto-generated client types.
- Clear error handling with descriptive console logging and proper HTTP status codes.
- Zero external monadic library overhead (removed `neverthrow`).
