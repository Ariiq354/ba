import { Data } from "effect";

export class InsufficientEffectiveBalanceError extends Data.TaggedError("InsufficientEffectiveBalanceError")<{
  readonly required: number;
  readonly effectiveSaldo: number;
}> {}

export class HargaSahamNotConfiguredError extends Data.TaggedError("HargaSahamNotConfiguredError") {}

export class MutasiAlreadyProcessedError extends Data.TaggedError("MutasiAlreadyProcessedError")<{
  readonly id: number;
}> {}

export class UnauthorizedMutasiAccessError extends Data.TaggedError("UnauthorizedMutasiAccessError")<{
  readonly id: number;
}> {}
