import { Data } from "effect";

export class UserAlreadyVerifiedError extends Data.TaggedError("UserAlreadyVerifiedError")<{
  readonly userId: number;
}> {}

export class UserUnverifiedError extends Data.TaggedError("UserUnverifiedError")<{
  readonly userId: number;
}> {}

export class AdminCannotBePjError extends Data.TaggedError("AdminCannotBePjError")<{
  readonly userId: number;
}> {}

export class ProfileImageRequiredError extends Data.TaggedError("ProfileImageRequiredError") {}

export class KelompokNotFoundError extends Data.TaggedError("KelompokNotFoundError")<{
  readonly idKelompok: number;
}> {}
