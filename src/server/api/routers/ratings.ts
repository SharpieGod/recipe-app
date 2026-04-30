import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const ratingRouter = createTRPCRouter({
  getMyRating: protectedProcedure
    .input(z.object({ recipeId: z.string() }))
    .query(async ({ ctx: { session, db }, input }) => {
      return db.rating.findUnique({
        where: {
          userId_recipeId: {
            userId: session.user.id,
            recipeId: input.recipeId,
          },
        },
        select: { value: true },
      });
    }),

  rate: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        rating: z.number().min(1).max(5),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId },
        select: { userId: true },
      });
      if (recipe?.userId === session.user.id)
        throw new Error("You cannot rate your own recipe");

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
