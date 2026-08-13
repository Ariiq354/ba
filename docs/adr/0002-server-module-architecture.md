# ADR 0002: Server Module & API Architecture Conventions

- **Status**: Accepted
- **Date**: 2026-08-13

## Context

Server modules (`server/modules/*`) and API handlers (`server/api/v1/*`) previously lacked explicit conventions for error handling and type inference:

1. Neverthrow error returns were constructed inconsistently (e.g. using `ResultAsync.fromPromise(Promise.reject(...))` anti-patterns or custom explicit types).
2. Drizzle database transactions threw raw literal objects (`throw { code, message }`), violating ESLint rules (`no-throw-literal`) and producing untyped transaction rejections.
3. Server API handlers had duplicated, defensive `typeof err === "object"` checks instead of clean pattern matching on error codes.

## Decisions

To enforce type safety, clean code, and consistency across all server code (`server/modules/*` and `server/api/*`), developers and agents MUST adhere to these 3 rules:

### 1. Neverthrow Implicit Type Inference

- Use `errAsync({ code: "...", message: "..." } as const)` for returning domain error results.
- **No Explicit Error Types**: Do NOT create manual interface/type aliases for module errors (e.g. `type MyModuleError`). Let TypeScript infer error unions implicitly from `repo.ts` to `service.ts` up to server API handlers.

### 2. Transaction Error Rollback & Mapping (`db.transaction`)

- Inside Drizzle `db.transaction(async (tx) => { ... })`, throw standard Error instances with formatted message strings when validation fails: `throw new Error("ERROR_CODE: Error message detail")`. This ensures Drizzle automatically rolls back the transaction while remaining compliant with ESLint `no-throw-literal`.
- In `ResultAsync.fromPromise(..., (cause) => ...)`, map cause instances matching `"CODE: message"` back to typed object literals: `{ code: "ERROR_CODE", message: "Error message detail" } as const`.

### 3. API Route Handler Error Matching

- All server API event handlers (`server/api/v1/*`) MUST consume Neverthrow results using `.match()`:

```ts
return await SimpananService.getSaldo(userId).match(
  data => data,
  (err) => {
    switch (err.code) {
      case "NOT_FOUND":
        throw createError({ statusCode: 404, statusMessage: err.message });
      case "INSUFFICIENT_BALANCE":
      case "ALREADY_PROCESSED":
        throw createError({ statusCode: 400, statusMessage: err.message });
      case "DATABASE_ERROR":
      default:
        console.error(err);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
  },
);
```

## Consequences

- End-to-end implicit type safety across server modules and API endpoints.
- Zero ESLint errors (`no-throw-literal`, `prefer-promise-reject-errors`, unused variables).
- Clean, predictable transaction rollback behavior and REST API HTTP status mapping.
