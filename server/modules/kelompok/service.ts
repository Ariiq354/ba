import { Effect } from "effect";
import { KelompokRepo } from "./repo";

export const KelompokService = {
  getOptionsKelompok: Effect.fn("KelompokService.getOptionsKelompok")(function* () {
    return yield* KelompokRepo.findAll();
  }),
};
