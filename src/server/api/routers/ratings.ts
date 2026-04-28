import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const ratingRouter = createTRPCRouter({
  rate: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        rating: z.number().min(1).max(5),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      return db.rating.upsert({
        where: {
          userId_recipeId: {
            userId: session.user.id,
            recipeId: input.recipeId,
          },
        },
        update: { value: input.rating },
        create: {
          userId: session.user.id,
          recipeId: input.recipeId,
          value: input.rating,
        },
      });
    }),
});
