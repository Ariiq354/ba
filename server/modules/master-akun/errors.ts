import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AkunNotFoundError extends Data.TaggedError("AkunNotFoundError")<{
  readonly id: number;
}> {}

export class DuplicateKodeAkunError extends Data.TaggedError("DuplicateKodeAkunError")<{
  readonly kodeAkun: string;
}> {}

export class DeleteAkunError extends Data.TaggedError("DeleteAkunError")<{
  readonly ids: number[];
  readonly message: string;
  readonly cause?: unknown;
}> {}
