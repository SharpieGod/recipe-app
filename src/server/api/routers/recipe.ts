import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const recipeRouter = createTRPCRouter({
  new: protectedProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const recipe = await db.recipe.create({
        data: {
          title: input.title,
          userId: session.user.id,
          description: "",
        },
      });

      await db.ingredientGroup.create({
        data: {
          label: "",
          order: 0,
          default: true,
          recipeId: recipe.id,
        },
      });

      return recipe;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      await db.$transaction([
        db.ingredient.deleteMany({ where: { recipeId: input.id } }),
        db.step.deleteMany({ where: { recipeId: input.id } }),
        db.ingredientGroup.deleteMany({ where: { recipeId: input.id } }),
        db.rating.deleteMany({ where: { recipeId: input.id } }),
        db.recipe.delete({
          where: { id: input.id, userId: session.user.id },
        }),
      ]);
    }),

  getRating: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx: { session, db }, input }) => {
      const recipe = await db.recipe.findFirst({ where: { id: input.id } });

      if (
        !recipe ||
        (!recipe.publishedAt && session?.user.id !== recipe.userId)
      ) {
        return null;
      }

      return await db.rating.aggregate({
        where: { recipeId: input.id },
        _avg: { value: true },
        _count: true,
      });
    }),

  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx: { session, db }, input }) => {
      const include = {
        ingredientGroups: {
          orderBy: { order: "asc" as const },
          include: { ingredients: { orderBy: { order: "asc" as const } } },
        },
        steps: { orderBy: { order: "asc" as const } },
      };

      const recipe = await db.recipe.findFirst({
        where: { id: input.id },
        include,
      });

      if (
        !recipe ||
        (!recipe.publishedAt && session?.user.id !== recipe.userId)
      ) {
        return null;
      }

      const isOwner = session?.user.id === recipe.userId;
      if (!recipe.publishedAt && !isOwner) return null;

      return recipe;
    }),

  getPreview: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx: { session, db }, input }) => {
      const recipe = await db.recipe.findFirst({
        where: { id: input.id },
      });

      if (
        !recipe ||
        (!recipe.publishedAt && session?.user.id !== recipe.userId)
      ) {
        return null;
      }

      const isOwner = session?.user.id === recipe.userId;
      if (!recipe.publishedAt && !isOwner) return null;

      return recipe;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        cookTimeMinutes: z.number().nullable(),
        prepTimeMinutes: z.number().nullable(),
        servings: z.number().nullable(),
        tags: z.array(z.string()),
        imageUrl: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      return await db.recipe.update({
        where: {
          id: input.id,
          userId: session.user.id,
        },
        data: {
          ...input,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        puclicityStatus: z.boolean(),
      }),
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      await db.recipe.update({
        where: {
          id: input.id,
          userId: session.user.id,
        },
        data: {
          publishedAt: input.puclicityStatus ? new Date() : null,
        },
      });
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ ctx: { db }, input }) => {
      type Row = {
        id: string;
        title: string;
        tags: string[];
        imageUrl: string | null;
      };
      return db.$queryRaw<Row[]>`
        SELECT id, title, tags, "imageUrl",
          GREATEST(
            MAX(similarity(tag_val, ${input.query})) * 3,
            similarity(title, ${input.query}) * 2,
            similarity(description, ${input.query})
          ) AS score
        FROM "Recipe"
        LEFT JOIN LATERAL unnest(tags) AS tag_val ON true
        GROUP BY id, title, tags, "imageUrl", description
        HAVING GREATEST(
          MAX(similarity(tag_val, ${input.query})) * 3,
          similarity(title, ${input.query}) * 2,
          similarity(description, ${input.query})
        ) > 0.1
        ORDER BY score DESC
        LIMIT 20
      `;
    }),
});
