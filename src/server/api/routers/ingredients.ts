import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const ingredientsRouter = createTRPCRouter({
  new: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        ingredientGroupId: z.string(),
        label: z.string(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const recipe = await db.recipe.findFirst({
        where: {
          id: input.recipeId,
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (!recipe) return null;

      return await db.ingredient.create({
        data: {
          label: input.label,
          recipeId: recipe.id,
          ingredientGroupId: input.ingredientGroupId,
          order: 0,
          unit: "NONE",
          value: 1,
        },
      });
    }),
});
