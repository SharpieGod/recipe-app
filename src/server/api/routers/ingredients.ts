import { z } from "zod";
import { Unit } from "generated/prisma";

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
        select: {
          id: true,
          ingredientGroups: {
            where: {
              id: input.ingredientGroupId,
            },
            select: {
              _count: { select: { ingredients: true } },
            },
          },
        },
      });

      if (!recipe) return null;

      return await db.ingredient.create({
        data: {
          label: input.label,
          recipeId: recipe.id,
          ingredientGroupId: input.ingredientGroupId,
          order: recipe.ingredientGroups[0]?._count.ingredients ?? 0,
          unit: "NONE",
          value: 1,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string(),
        unit: z.nativeEnum(Unit),
        value: z.number(),
        order: z.number(),
        ingredientGroupId: z.string(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const ingredient = await db.ingredient.findFirst({
        where: {
          id: input.id,
          recipe: { userId: session.user.id },
        },
        select: { id: true },
      });

      if (!ingredient) return null;

      const { id, ...data } = input;
      return await db.ingredient.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { session, db }, input }) => {
      const ingredient = await db.ingredient.findFirst({
        where: {
          id: input.id,
          recipe: { userId: session.user.id },
        },
        select: { id: true },
      });

      if (!ingredient) return null;

      return await db.ingredient.delete({ where: { id: input.id } });
    }),
});
