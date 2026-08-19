# ADR 0002: Server Module & API Architecture Conventions (Effect-TS)

- **Status**: Accepted (Updated 2026-08-19: Standardized on Effect-TS architecture)
- **Date**: 2026-08-13 (Revised 2026-08-19)

## Context

Previous server architecture relied on plain Promises with `catchError` tuple handlers (`[err, data]`) and direct `createError` throws inside services. While simple, it lacked compile-time typed error tracking across layer boundaries. To achieve type-safe domain errors, clean composability, explicit error recovery, and robust Postgres constraint handling, backend modules are standardized on **Effect-TS**.

## Decisions

All server code under `server/modules/*` and `server/api/*` MUST adhere to the following architecture and style conventions:

### 1. Naming Conventions

| Component                | Naming Pattern                                    | Example                                                                           |
| :----------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **Object Module**        | `PascalCase` + `Repo` / `Service`                 | `MasterAkunRepo`, `MasterAkunService`                                             |
| **Repo Method**          | `camelCase` (CRUD / specific query verb)          | `create`, `findAll`, `findById`, `update`, `deleteBulk`                           |
| **Service Method**       | `camelCase` (Action verb + Entity)                | `createAkun`, `getPaginatedAkun`, `updateAkun`, `deleteAkun`                      |
| **Effect.fn Identifier** | `"<ObjectName>.<methodName>"`                     | `Effect.fn("MasterAkunRepo.create")`, `Effect.fn("MasterAkunService.createAkun")` |
| **Zod Schema Variable**  | `camelCase` + Suffix (`Schema` / `Enum`)          | `createAkunSchema`, `getAkunQuerySchema`, `kategoriAkunEnum`                      |
| **Inferred Type**        | `PascalCase` (Identical to schema name)           | `CreateAkunSchema`, `GetAkunQuerySchema`                                          |
| **Tagged Error Class**   | `PascalCase` + `Error` (Tag string matches class) | `DuplicateKodeAkunError`, `DatabaseError`, `ItemNotFoundError`                    |

### 2. Module Layering

#### A. Schema & Model (`server/modules/<module>/model.ts`)

- Reuse common query schemas: spread `paginationSearchSchema.shape` from `~~/server/utils/schema`.
- Derive update schemas using `.partial()` from creation schemas (e.g. `createAkunSchema.partial()`).
- Always export inferred types matching schema names: `export type CreateAkunSchema = z.infer<typeof createAkunSchema>;`.

#### B. Error Definitions (`errors.ts` & `server/utils/error.ts`)

- Define errors using `Data.TaggedError("<ErrorName>")<{ readonly prop: Type }>` from `effect`.
- **Generic Errors** (`DatabaseError`, `ItemNotFoundError`, `ItemsNotFoundError`) belong in `~~/server/utils/error.ts`.
- **Domain Errors** with specific business payloads (e.g. `DuplicateKodeAkunError`) belong in `server/modules/<module>/errors.ts`.

#### C. Repository Layer (`server/modules/<module>/repo.ts`)

- Implement functions with `Effect.fn("Repo.method")((args) => Effect.tryPromise({ try: async () => ..., catch: (error) => ... }))`.
- Rely on database constraints instead of redundant pre-check SELECT queries. Use `isUniqueViolation(error)` (`~~/server/utils/pgcode`) to map unique violations (PG `23505`) to typed domain errors.
- **Single-Record Queries**: Retrieve single records using Drizzle relational queries `db.query.<model>.findFirst(...)` / `tx.query.<model>.findFirst(...)` returning `T | undefined` directly (without redundant `?? null` conversions). Paging and existence checks (`if (!item) yield* new ItemNotFoundError(...)`) are handled exclusively by the Service Layer. _(Exception: queries requiring SQL-level pessimistic locking `.for("update")` continue using the standard query builder)._
- **Create Operations**: Standard `create` operations return `void` (no `.returning()` or entity return value), unless explicitly required for chained foreign-key orchestration in multi-step transactions (e.g., retrieving a generated header ID to insert detail rows).
- **Update & Delete Operations**: Use `.returning()` so the service layer can inspect `rows.length === 0` to yield `ItemNotFoundError` or `ItemsNotFoundError`.
- Paginated queries must return `{ total, data }` using `db.$count(qb)` and `qb.limit(limit).offset(offset)`.
- **Transaction Placement & `tx` Parameter**:
  - **Single-Repo Transaction (Encapsulated in Repo)**: If an operation is contained within a single repository method (even if mutating multiple tables), the transaction `await db.transaction(async (tx) => { ... })` MUST be encapsulated inside the repository method. The method MUST NOT accept a `tx` parameter, allowing the Service Layer to simply call `yield* Repo.method(...)`.
  - **Multi-Step Transaction (Managed in Service)**: Only when the Service Layer orchestrates multiple repository methods or database utilities (e.g., sequence generation + unban/insert) that must be atomic together, the transaction `db.transaction(async (tx) => ...)` is managed in the Service Layer. In this case, only the participating repository methods accept `tx: DbTransaction | typeof db = db`.
  - Standard query methods (`findById`, `findAll`) MUST NOT include `tx`.

```ts
import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "~~/server/database";
import { akun } from "~~/server/database/schema/akun";
import { DatabaseError } from "~~/server/utils/error";
import { isUniqueViolation } from "~~/server/utils/pgcode";
import { DuplicateKodeAkunError } from "./errors";

export const MasterAkunRepo = {
  create: Effect.fn("MasterAkunRepo.create")((data: CreateAkunSchema) =>
    Effect.tryPromise({
      try: async () => {
        await db.insert(akun).values(data);
      },
      catch: (error) => {
        if (isUniqueViolation(error)) {
          return new DuplicateKodeAkunError({ kodeAkun: data.kodeAkun });
        }
        return new DatabaseError({ error });
      },
    }),
  ),

  findAll: Effect.fn("MasterAkunRepo.findAll")((query: GetAkunQuerySchema) =>
    Effect.tryPromise({
      try: async () => {
        const conditions = [];
        if (query.search) {
          conditions.push(ilike(akun.namaAkun, `%${query.search}%`));
        }

        const qb = db
          .select()
          .from(akun)
          .where(and(...conditions))
          .orderBy(asc(akun.kodeAkun));

        const offset = (query.page - 1) * query.limit;
        const total = await db.$count(qb);
        const data = await qb.limit(query.limit).offset(offset);

        return { total, data };
      },
      catch: error => new DatabaseError({ error }),
    }),
  ),
};
```

#### D. Service Layer (`server/modules/<module>/service.ts`)

- Implement methods with generator syntax: `Effect.fn("Service.method")(function* (args) { ... })`.
- Use `yield*` to invoke repo methods and raise typed errors (e.g. `if (rows.length === 0) return yield* new ItemNotFoundError({ id });`).
- For multi-step transactions coordinating multiple repo methods or DB utilities, execute `db.transaction(async (tx) => { ... })` and pass `tx` to participating repo functions. For single-method transactions, invoke the repo method directly via `yield*`.

```ts
import type { CreateAkunSchema, GetAkunQuerySchema, UpdateAkunSchema } from "./model";
import { Effect } from "effect";
import { ItemNotFoundError, ItemsNotFoundError } from "~~/server/utils/error";
import { MasterAkunRepo } from "./repo";

export const MasterAkunService = {
  createAkun: Effect.fn("MasterAkunService.createAkun")(function* (data: CreateAkunSchema) {
    return yield* MasterAkunRepo.create(data);
  }),

  getPaginatedAkun: Effect.fn("MasterAkunService.getPaginatedAkun")(function* (query: GetAkunQuerySchema) {
    return yield* MasterAkunRepo.findAll(query);
  }),

  updateAkun: Effect.fn("MasterAkunService.updateAkun")(function* (id: number, data: UpdateAkunSchema) {
    const returning = yield* MasterAkunRepo.update(id, data);
    if (returning.length === 0) {
      return yield* new ItemNotFoundError({ id });
    }
  }),
};
```

#### E. API Endpoints (`server/api/v1/*`)

- Extract and validate parameters using safe validators (`readValidatedBodySafe`, `getValidatedQuerySafe`, `getValidatedRouterParamsSafe`).
- Check authorization guards at the very beginning (`authGuard(event)`, `adminGuard(event)`).
- Pipe service execution through `Effect.catchTags` to standard 3-property `createError({ statusCode, statusMessage, message })`, terminating with `Effect.runPromise`.

```ts
import { Effect } from "effect";
import { createAkunSchema } from "~~/server/modules/master-akun/model";
import { MasterAkunService } from "~~/server/modules/master-akun/service";
import { adminGuard } from "~~/server/utils/guard";
import { readValidatedBodySafe } from "~~/server/utils/validator";

export default defineEventHandler(async (event) => {
  adminGuard(event);
  const body = await readValidatedBodySafe(event, createAkunSchema);

  return await MasterAkunService.createAkun(body).pipe(
    Effect.catchTags({
      DuplicateKodeAkunError: err =>
        Effect.fail(
          createError({
            statusCode: 400,
            statusMessage: "Conflict",
            message: `Kode akun '${err.kodeAkun}' sudah digunakan`,
          }),
        ),
      DatabaseError: (err) => {
        console.error("Database error:", err.error);
        return Effect.fail(
          createError({
            statusCode: 500,
            statusMessage: "Database Error",
            message: "Gagal membuat data akun",
          }),
        );
      },
    }),
    Effect.runPromise,
  );
});
```

### 3. Response Structure Standard

All list/pagination endpoints return:

```ts
export interface PaginatedResult<T> {
  total: number;
  data: T[];
}
```

## Consequences

- Full compile-time type safety across error channels.
- Predictable and uniform exception handling in API controllers.
- Elimination of redundant preliminary DB lookups by leveraging Postgres constraints.
- Consistent `{ total, data }` response contracts between backend and frontend.
