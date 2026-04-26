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
          _count: {
            select: { ingredientGroups: true },
          },
        },
      });

      if (!recipe) return;

      return await db.ingredientGroup.create({
        data: {
          label: input.label,
          order: recipe._count.ingredientGroups, // its 0-indexed
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
      return await db.ingredientGroup.update({
        where: {
          id: input.id,
          recipe: { userId: session.user.id },
        },
        data: {
          label: input.label,
          order: input.order,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      console.log("DELETING!!");
      const defaultIngredientGroup = await db.ingredientGroup.findFirst({
        where: {
          default: true,
          recipe: {
            userId: session.user.id,
            ingredientGroups: {
              some: {
                id: input.id,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!defaultIngredientGroup) return null;
      if (defaultIngredientGroup.id === input.id) return null;

      await db.ingredient.updateMany({
        where: {
          ingredientGroupId: input.id,
          recipe: {
            userId: session.user.id,
          },
        },
        data: {
          ingredientGroupId: defaultIngredientGroup.id,
        },
      });

      await db.ingredientGroup.delete({
        where: {
          id: input.id,
          recipe: {
            userId: session.user.id,
          },
        },
      });
    }),
});
