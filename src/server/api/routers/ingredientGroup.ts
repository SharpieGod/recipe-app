import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const ingredientGroupsRouter = createTRPCRouter({
  new: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        label: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const recipe = await db.recipe.findFirst({
        where: {
          id: input.recipeId,
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!recipe) return;

      return await db.ingredientGroup.create({
        data: {
          label: input.label,
          order: 0,
          recipeId: recipe.id,
        },
        include: {
          ingredients: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string(),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const section = await db.ingredientGroup.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!section) return null;

      const recipe = await db.recipe.findFirst({
        where: {
          id: section.recipeId,
          userId: session.user.id,
        },
      });

      if (!recipe) return null;

      return await db.ingredientGroup.update({
        where: {
          id: input.id,
        },
        data: {
          label: input.label,
          order: input.order,
        },
      });
    }),
});
