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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        unit: z.nativeEnum(Unit).optional(),
        value: z.number().optional(),
        order: z.number().optional(),
        ingredientGroupId: z.string().optional(),
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
