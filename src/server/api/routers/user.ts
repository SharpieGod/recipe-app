import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUserRecipes: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const isOwner = ctx.session?.user.id === input.id;

      return await ctx.db.recipe.findMany({
        where: {
          userId: input.id,
          ...(!isOwner && { publishedAt: { not: null } }),
        },

        orderBy: isOwner ? { createdAt: "desc" } : { publishedAt: "desc" },
      });
    }),
});
