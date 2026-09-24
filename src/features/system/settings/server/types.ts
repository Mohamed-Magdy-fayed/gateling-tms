import type { TRPCContext } from "@/integrations/trpc/init";

/** Context shape after `platformOwnerProcedure`'s auth + owner check has run. */
export type PlatformOwnerTRPCContext = TRPCContext & {
  session: NonNullable<TRPCContext["session"]>;
};
