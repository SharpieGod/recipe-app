import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const stepRouter = createTRPCRouter({
  new: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        instruction: z.string(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const recipe = await db.recipe.findFirst({
        where: {
          id: input.recipeId,
          userId: session.user.id,
        },
        select: {
          _count: { select: { steps: true } },
        },
      });

      if (!recipe) return null;

      return await db.step.create({
        data: {
          recipeId: input.recipeId,
          order: recipe._count.steps ?? 0,
          instruction: input.instruction,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        instruction: z.string(),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      return await db.step.update({
        where: { id: input.id, recipe: { userId: session.user.id } },
        data: { instruction: input.instruction, order: input.order },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { session, db }, input }) => {
      return await db.step.delete({
        where: { id: input.id, recipe: { userId: session.user.id } },
      });
    }),
});
