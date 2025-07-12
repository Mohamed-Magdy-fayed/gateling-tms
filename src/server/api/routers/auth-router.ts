import {
    createTRPCRouter,
    publicProcedure,
} from "@/server/api/trpc";
import z from "zod";
import { UsersTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
    checkUser: publicProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const [user] = await ctx.db
                .select()
                .from(UsersTable)
                .where(
                    eq(UsersTable.email, input),
                );

            if (user) {
                return { exists: true };
            }

            return { exists: false };
        }),
});
