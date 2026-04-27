import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
          publishedAt: null,
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
      // Make sure that recipe is publishable

      const recipe = await db.recipe.findFirst({
        where: {
          id: input.id,
          userId: session.user.id,
        },
        include: {
          ingredients: { include: { ingredientGroup: true } },
          ingredientGroups: true,
          steps: true,
        },
      });

      if (!recipe) return null;

      if (input.puclicityStatus) {
        const errors: string[] = [];

        if (!recipe.title.trim()) errors.push("Recipe title is required");

        for (const ingredient of recipe.ingredients) {
          if (!ingredient.label.trim())
            errors.push(`An ingredient is missing a label`);
          if (ingredient.value <= 0)
            errors.push(
              `Ingredient "${ingredient.label}" has an invalid value`,
            );
        }

        for (const group of recipe.ingredientGroups) {
          if (!group.default && !group.label.trim())
            errors.push("An ingredient section is missing a label");
        }

        for (const step of recipe.steps) {
          if (!step.instruction.trim())
            errors.push("A step is missing instructions");
        }

        if (errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errors.join("\n"),
          });
        }
      }

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

  seedDemo: protectedProcedure.mutation(async ({ ctx: { db, session } }) => {
    // Generated by claude
    const userId = session.user.id;

    const demos = [
      {
        title: "Classic Spaghetti Carbonara",
        description:
          "A rich and creamy Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper. No cream needed — the silky sauce comes entirely from the egg and cheese emulsion.",
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        tags: ["pasta", "italian", "dinner", "quick"],
        groups: [
          {
            label: "",
            default: true,
            order: 0,
            ingredients: [
              { label: "spaghetti", value: 400, unit: "GRAM", order: 0 },
              {
                label: "guanciale or pancetta",
                value: 200,
                unit: "GRAM",
                order: 1,
              },
              { label: "large eggs", value: 4, unit: "NONE", order: 2 },
              {
                label: "Pecorino Romano, finely grated",
                value: 100,
                unit: "GRAM",
                order: 3,
              },
              {
                label: "black pepper, freshly cracked",
                value: 2,
                unit: "TEASPOON",
                order: 4,
              },
              { label: "salt", value: 1, unit: "TABLESPOON", order: 5 },
            ],
          },
        ],
        steps: [
          {
            instruction:
              "Bring a large pot of salted water to a boil. Cook spaghetti until al dente, reserving 1 cup of pasta water before draining.",
            order: 0,
          },
          {
            instruction:
              "Cut guanciale into small cubes and cook in a cold pan over medium heat until golden and crispy. Remove from heat.",
            order: 1,
          },
          {
            instruction:
              "Whisk eggs with grated Pecorino Romano and plenty of cracked black pepper in a bowl.",
            order: 2,
          },
          {
            instruction:
              "Add hot drained pasta to the pan with guanciale. Toss off the heat, then add the egg mixture, stirring vigorously and adding pasta water a splash at a time until you have a creamy sauce.",
            order: 3,
          },
          {
            instruction:
              "Serve immediately topped with extra Pecorino and black pepper.",
            order: 4,
          },
        ],
      },
      {
        title: "Chicken Tikka Masala",
        description:
          "Tender marinated chicken in a luscious, aromatic tomato-cream sauce. This British-Indian classic is deeply spiced, mildly hot, and absolutely addictive over basmati rice.",
        prepTimeMinutes: 30,
        cookTimeMinutes: 40,
        servings: 4,
        tags: ["indian", "chicken", "dinner", "spicy"],
        groups: [
          {
            label: "Marinade",
            default: false,
            order: 0,
            ingredients: [
              {
                label: "chicken breast, cubed",
                value: 700,
                unit: "GRAM",
                order: 0,
              },
              { label: "full-fat yogurt", value: 1, unit: "CUP", order: 1 },
              { label: "lemon juice", value: 2, unit: "TABLESPOON", order: 2 },
              { label: "garam masala", value: 2, unit: "TEASPOON", order: 3 },
              { label: "turmeric", value: 1, unit: "TEASPOON", order: 4 },
              { label: "chili powder", value: 1, unit: "TEASPOON", order: 5 },
            ],
          },
          {
            label: "Sauce",
            default: false,
            order: 1,
            ingredients: [
              { label: "butter", value: 3, unit: "TABLESPOON", order: 0 },
              {
                label: "onion, finely diced",
                value: 1,
                unit: "NONE",
                order: 1,
              },
              {
                label: "garlic cloves, minced",
                value: 5,
                unit: "NONE",
                order: 2,
              },
              {
                label: "fresh ginger, grated",
                value: 1,
                unit: "TABLESPOON",
                order: 3,
              },
              { label: "crushed tomatoes", value: 400, unit: "GRAM", order: 4 },
              { label: "heavy cream", value: 1, unit: "CUP", order: 5 },
              { label: "garam masala", value: 2, unit: "TEASPOON", order: 6 },
              { label: "cumin", value: 1, unit: "TEASPOON", order: 7 },
              {
                label: "coriander powder",
                value: 1,
                unit: "TEASPOON",
                order: 8,
              },
            ],
          },
        ],
        steps: [
          {
            instruction:
              "Mix all marinade ingredients with chicken, cover, and refrigerate for at least 1 hour (overnight is best).",
            order: 0,
          },
          {
            instruction:
              "Thread chicken onto skewers and grill or broil at high heat until charred at the edges, about 10–12 minutes. Set aside.",
            order: 1,
          },
          {
            instruction:
              "Melt butter in a large pan over medium heat. Cook onion until golden, then add garlic and ginger and cook 2 more minutes.",
            order: 2,
          },
          {
            instruction:
              "Add spices and cook 1 minute, then add crushed tomatoes. Simmer for 15 minutes until thickened.",
            order: 3,
          },
          {
            instruction:
              "Stir in heavy cream, add the grilled chicken, and simmer 5 more minutes. Season to taste and serve over basmati rice.",
            order: 4,
          },
        ],
      },
      {
        title: "Avocado & Black Bean Tacos",
        description:
          "Vibrant, plant-based tacos loaded with spiced black beans, creamy avocado, pickled red onion, and a smoky chipotle crema. Ready in 25 minutes and impossible to put down.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 10,
        servings: 3,
        tags: ["tacos", "vegetarian", "mexican", "quick", "lunch"],
        groups: [
          {
            label: "Black Beans",
            default: false,
            order: 0,
            ingredients: [
              {
                label: "black beans, drained and rinsed",
                value: 400,
                unit: "GRAM",
                order: 0,
              },
              { label: "olive oil", value: 1, unit: "TABLESPOON", order: 1 },
              { label: "cumin", value: 1, unit: "TEASPOON", order: 2 },
              { label: "smoked paprika", value: 1, unit: "TEASPOON", order: 3 },
              {
                label: "garlic clove, minced",
                value: 1,
                unit: "NONE",
                order: 4,
              },
              { label: "salt", value: 0.5, unit: "TEASPOON", order: 5 },
            ],
          },
          {
            label: "Toppings",
            default: false,
            order: 1,
            ingredients: [
              { label: "ripe avocados", value: 2, unit: "NONE", order: 0 },
              { label: "lime juice", value: 2, unit: "TABLESPOON", order: 1 },
              {
                label: "red onion, thinly sliced",
                value: 0.5,
                unit: "NONE",
                order: 2,
              },
              {
                label: "apple cider vinegar",
                value: 3,
                unit: "TABLESPOON",
                order: 3,
              },
              { label: "sour cream", value: 0.5, unit: "CUP", order: 4 },
              {
                label: "chipotle in adobo, minced",
                value: 1,
                unit: "TABLESPOON",
                order: 5,
              },
              {
                label: "small corn tortillas",
                value: 6,
                unit: "NONE",
                order: 6,
              },
              { label: "fresh cilantro", value: 0.25, unit: "CUP", order: 7 },
            ],
          },
        ],
        steps: [
          {
            instruction:
              "Pickle the red onion: toss sliced onion with apple cider vinegar and a pinch of salt. Set aside while you prep everything else.",
            order: 0,
          },
          {
            instruction:
              "Heat olive oil in a skillet, add garlic and cook 30 seconds, then add beans and spices. Cook 5 minutes until warmed and slightly crispy.",
            order: 1,
          },
          {
            instruction:
              "Mash avocados with lime juice and salt to your preferred texture.",
            order: 2,
          },
          {
            instruction:
              "Mix sour cream with chipotle in adobo to make the crema.",
            order: 3,
          },
          {
            instruction:
              "Warm tortillas in a dry pan. Assemble tacos with beans, avocado, pickled onion, chipotle crema, and fresh cilantro.",
            order: 4,
          },
        ],
      },
      {
        title: "Beef & Vegetable Stir-Fry",
        description:
          "A high-heat wok dinner with tender sliced beef, crisp-tender vegetables, and a savory umami sauce. Faster than takeout and way more satisfying.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 12,
        servings: 2,
        tags: ["chinese", "beef", "dinner", "quick", "wok"],
        groups: [
          {
            label: "Beef & Marinade",
            default: false,
            order: 0,
            ingredients: [
              {
                label: "flank steak, thinly sliced against the grain",
                value: 350,
                unit: "GRAM",
                order: 0,
              },
              { label: "soy sauce", value: 2, unit: "TABLESPOON", order: 1 },
              { label: "cornstarch", value: 1, unit: "TABLESPOON", order: 2 },
              { label: "sesame oil", value: 1, unit: "TEASPOON", order: 3 },
            ],
          },
          {
            label: "Stir-Fry Sauce",
            default: false,
            order: 1,
            ingredients: [
              { label: "oyster sauce", value: 3, unit: "TABLESPOON", order: 0 },
              { label: "soy sauce", value: 2, unit: "TABLESPOON", order: 1 },
              { label: "rice vinegar", value: 1, unit: "TABLESPOON", order: 2 },
              { label: "sugar", value: 1, unit: "TEASPOON", order: 3 },
              { label: "cornstarch", value: 1, unit: "TEASPOON", order: 4 },
              { label: "water", value: 3, unit: "TABLESPOON", order: 5 },
            ],
          },
          {
            label: "Vegetables",
            default: false,
            order: 2,
            ingredients: [
              { label: "broccoli florets", value: 200, unit: "GRAM", order: 0 },
              {
                label: "red bell pepper, sliced",
                value: 1,
                unit: "NONE",
                order: 1,
              },
              { label: "snap peas", value: 100, unit: "GRAM", order: 2 },
              {
                label: "garlic cloves, minced",
                value: 3,
                unit: "NONE",
                order: 3,
              },
              {
                label: "fresh ginger, minced",
                value: 1,
                unit: "TEASPOON",
                order: 4,
              },
              { label: "neutral oil", value: 2, unit: "TABLESPOON", order: 5 },
            ],
          },
        ],
        steps: [
          {
            instruction:
              "Toss sliced beef with soy sauce, cornstarch, and sesame oil. Let marinate 10 minutes.",
            order: 0,
          },
          {
            instruction:
              "Whisk together all stir-fry sauce ingredients and set aside.",
            order: 1,
          },
          {
            instruction:
              "Heat a wok or large skillet over the highest heat until smoking. Add 1 tbsp oil and sear beef in a single layer 1–2 minutes per side. Remove and set aside.",
            order: 2,
          },
          {
            instruction:
              "Add remaining oil to the wok. Stir-fry garlic and ginger for 30 seconds, then add broccoli and bell pepper. Cook 3 minutes, then add snap peas.",
            order: 3,
          },
          {
            instruction:
              "Return beef to the wok, pour in the sauce, and toss everything together over high heat for 1 minute until glossy. Serve over steamed rice.",
            order: 4,
          },
        ],
      },
      {
        title: "Lemon Ricotta Pancakes",
        description:
          "Impossibly fluffy, cloud-like pancakes with a bright lemony tang from fresh zest and creamy ricotta folded into the batter. The weekend breakfast upgrade you didn't know you needed.",
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 2,
        tags: ["breakfast", "pancakes", "vegetarian", "sweet"],
        groups: [
          {
            label: "",
            default: true,
            order: 0,
            ingredients: [
              { label: "whole-milk ricotta", value: 1, unit: "CUP", order: 0 },
              {
                label: "large eggs, separated",
                value: 3,
                unit: "NONE",
                order: 1,
              },
              {
                label: "all-purpose flour",
                value: 0.75,
                unit: "CUP",
                order: 2,
              },
              { label: "sugar", value: 2, unit: "TABLESPOON", order: 3 },
              { label: "baking powder", value: 1, unit: "TEASPOON", order: 4 },
              { label: "lemon zest", value: 2, unit: "TEASPOON", order: 5 },
              { label: "lemon juice", value: 2, unit: "TABLESPOON", order: 6 },
              {
                label: "vanilla extract",
                value: 1,
                unit: "TEASPOON",
                order: 7,
              },
              { label: "pinch of salt", value: 1, unit: "NONE", order: 8 },
              {
                label: "butter, for cooking",
                value: 2,
                unit: "TABLESPOON",
                order: 9,
              },
            ],
          },
        ],
        steps: [
          {
            instruction:
              "Separate eggs. Mix yolks with ricotta, lemon zest, lemon juice, and vanilla until smooth.",
            order: 0,
          },
          {
            instruction:
              "Whisk together flour, sugar, baking powder, and salt in a separate bowl, then fold into the ricotta mixture.",
            order: 1,
          },
          {
            instruction: "Beat egg whites to stiff peaks in a clean bowl.",
            order: 2,
          },
          {
            instruction:
              "Gently fold egg whites into the batter in two additions — don't overmix, some streaks are fine.",
            order: 3,
          },
          {
            instruction:
              "Melt butter in a non-stick pan over medium-low heat. Cook pancakes in batches, about 3 minutes per side until golden. Serve with maple syrup and fresh berries.",
            order: 4,
          },
        ],
      },
    ];

    for (const demo of demos) {
      const recipe = await db.recipe.create({
        data: {
          userId,
          title: demo.title,
          description: demo.description,
          prepTimeMinutes: demo.prepTimeMinutes,
          cookTimeMinutes: demo.cookTimeMinutes,
          servings: demo.servings,
          tags: demo.tags,
          publishedAt: null,
        },
      });

      if (!demo.groups.some((g) => g.default)) {
        await db.ingredientGroup.create({
          data: { recipeId: recipe.id, label: "", default: true, order: -1 },
        });
      }

      for (const group of demo.groups) {
        const ig = await db.ingredientGroup.create({
          data: {
            recipeId: recipe.id,
            label: group.label,
            default: group.default,
            order: group.order,
          },
        });

        await db.ingredient.createMany({
          data: group.ingredients.map((ing) => ({
            recipeId: recipe.id,
            ingredientGroupId: ig.id,
            label: ing.label,
            value: ing.value,
            unit: ing.unit as never,
            order: ing.order,
          })),
        });
      }

      await db.step.createMany({
        data: demo.steps.map((s) => ({
          recipeId: recipe.id,
          instruction: s.instruction,
          order: s.order,
        })),
      });
    }

    return { created: demos.length };
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        cursor: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx: { db }, input }) => {
      type Row = {
        id: string;
        title: string;
        tags: string[];
        imageUrl: string | null;
      };
      const { query, cursor: offset, limit } = input;
      const rows = await db.$queryRaw<Row[]>`
        SELECT id, title, tags, "imageUrl",
          GREATEST(
            MAX(similarity(tag_val, ${query})) * 3,
            similarity(title, ${query}) * 2,
            similarity(description, ${query})
          ) AS score
        FROM "Recipe"
        LEFT JOIN LATERAL unnest(tags) AS tag_val ON true
        WHERE "publishedAt" IS NOT NULL
        GROUP BY id, title, tags, "imageUrl", description
        HAVING GREATEST(
          MAX(similarity(tag_val, ${query})) * 3,
          similarity(title, ${query}) * 2,
          similarity(description, ${query})
        ) > 0.1
        ORDER BY score DESC
        LIMIT ${limit + 1}
        OFFSET ${offset}
      `;

      const hasMore = rows.length > limit;
      return {
        items: hasMore ? rows.slice(0, limit) : rows,
        nextCursor: hasMore ? offset + limit : null,
      };
    }),
});
