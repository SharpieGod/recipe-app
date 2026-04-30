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
        user: true,
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
        title: "French Onion Soup",
        description:
          "A deeply savory, slow-caramelized onion broth topped with a thick crouton and blanketed in bubbling Gruyère. The caramelization takes patience but the result is worth every minute.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 75,
        servings: 4,
        tags: ["french", "soup", "dinner", "comfort food"],
        groups: [
          {
            label: "",
            default: true,
            order: 0,
            ingredients: [
              { label: "yellow onions, thinly sliced", value: 1.5, unit: "KILOGRAM", order: 0 },
              { label: "unsalted butter", value: 4, unit: "TABLESPOON", order: 1 },
              { label: "olive oil", value: 2, unit: "TABLESPOON", order: 2 },
              { label: "dry white wine", value: 0.5, unit: "CUP", order: 3 },
              { label: "beef stock", value: 1.5, unit: "LITER", order: 4 },
              { label: "fresh thyme sprigs", value: 4, unit: "NONE", order: 5 },
              { label: "bay leaves", value: 2, unit: "NONE", order: 6 },
              { label: "baguette, sliced 2cm thick", value: 8, unit: "NONE", order: 7 },
              { label: "Gruyère, grated", value: 200, unit: "GRAM", order: 8 },
              { label: "salt and pepper", value: 1, unit: "NONE", order: 9 },
            ],
          },
        ],
        steps: [
          { instruction: "Melt butter with olive oil in a large heavy pot over medium-low heat. Add onions and 1 tsp salt. Cook uncovered, stirring every 10 minutes, for 50–60 minutes until deeply golden and jammy.", order: 0 },
          { instruction: "Increase heat to medium-high, add wine, and scrape up any browned bits. Cook until wine evaporates, about 3 minutes.", order: 1 },
          { instruction: "Add stock, thyme, and bay leaves. Simmer 20 minutes. Season generously with salt and pepper. Remove thyme and bay leaves.", order: 2 },
          { instruction: "Toast baguette slices under the broiler until golden on both sides.", order: 3 },
          { instruction: "Ladle soup into oven-safe bowls, place a crouton on top, and pile on the Gruyère. Broil 3–4 minutes until the cheese is melted and bubbly with brown spots.", order: 4 },
        ],
      },
      {
        title: "Shakshuka",
        description:
          "Eggs poached directly in a spiced, smoky tomato and pepper sauce. A one-pan North African and Middle Eastern staple that works for breakfast, lunch, or dinner.",
        prepTimeMinutes: 10,
        cookTimeMinutes: 25,
        servings: 2,
        tags: ["middle eastern", "eggs", "breakfast", "vegetarian", "quick"],
        groups: [
          {
            label: "",
            default: true,
            order: 0,
            ingredients: [
              { label: "olive oil", value: 3, unit: "TABLESPOON", order: 0 },
              { label: "onion, diced", value: 1, unit: "NONE", order: 1 },
              { label: "red bell pepper, diced", value: 1, unit: "NONE", order: 2 },
              { label: "garlic cloves, minced", value: 4, unit: "NONE", order: 3 },
              { label: "cumin", value: 1.5, unit: "TEASPOON", order: 4 },
              { label: "smoked paprika", value: 1.5, unit: "TEASPOON", order: 5 },
              { label: "cayenne pepper", value: 0.25, unit: "TEASPOON", order: 6 },
              { label: "crushed tomatoes", value: 800, unit: "GRAM", order: 7 },
              { label: "large eggs", value: 4, unit: "NONE", order: 8 },
              { label: "feta, crumbled", value: 100, unit: "GRAM", order: 9 },
              { label: "fresh parsley, chopped", value: 0.25, unit: "CUP", order: 10 },
            ],
          },
        ],
        steps: [
          { instruction: "Heat olive oil in a wide skillet over medium heat. Cook onion and pepper until soft, about 8 minutes. Add garlic and all spices, stir 1 minute.", order: 0 },
          { instruction: "Add crushed tomatoes, season with salt, and simmer 10 minutes until slightly thickened.", order: 1 },
          { instruction: "Use a spoon to make 4 wells in the sauce. Crack an egg into each well. Cover and cook on medium-low heat 6–8 minutes, until whites are set but yolks are still runny.", order: 2 },
          { instruction: "Scatter feta and parsley over the top. Serve straight from the pan with crusty bread or pita.", order: 3 },
        ],
      },
      {
        title: "Miso Ramen",
        description:
          "A rich, warming bowl with a deeply savory miso-tare broth, springy noodles, soft-boiled eggs, and a heap of toppings. This from-scratch version is weeknight-friendly but tastes like it took all day.",
        prepTimeMinutes: 20,
        cookTimeMinutes: 30,
        servings: 2,
        tags: ["japanese", "ramen", "soup", "dinner", "noodles"],
        groups: [
          {
            label: "Broth",
            default: false,
            order: 0,
            ingredients: [
              { label: "chicken or pork stock", value: 1, unit: "LITER", order: 0 },
              { label: "white miso paste", value: 3, unit: "TABLESPOON", order: 1 },
              { label: "soy sauce", value: 2, unit: "TABLESPOON", order: 2 },
              { label: "sesame oil", value: 1, unit: "TABLESPOON", order: 3 },
              { label: "garlic cloves, grated", value: 3, unit: "NONE", order: 4 },
              { label: "fresh ginger, grated", value: 1, unit: "TABLESPOON", order: 5 },
              { label: "gochujang", value: 1, unit: "TABLESPOON", order: 6 },
            ],
          },
          {
            label: "Toppings",
            default: false,
            order: 1,
            ingredients: [
              { label: "ramen noodles, fresh or dry", value: 200, unit: "GRAM", order: 0 },
              { label: "large eggs", value: 2, unit: "NONE", order: 1 },
              { label: "corn kernels", value: 0.5, unit: "CUP", order: 2 },
              { label: "butter", value: 1, unit: "TABLESPOON", order: 3 },
              { label: "green onions, sliced", value: 3, unit: "NONE", order: 4 },
              { label: "nori sheets", value: 2, unit: "NONE", order: 5 },
              { label: "sesame seeds", value: 1, unit: "TABLESPOON", order: 6 },
            ],
          },
        ],
        steps: [
          { instruction: "Soft-boil eggs: lower into boiling water and cook exactly 7 minutes. Transfer to ice water for 5 minutes, then peel. Set aside.", order: 0 },
          { instruction: "In a small bowl, whisk together miso, soy sauce, sesame oil, garlic, ginger, and gochujang into a smooth paste.", order: 1 },
          { instruction: "Bring stock to a simmer. Whisk in the miso paste. Do not boil after adding miso or the flavor dulls. Keep on low heat.", order: 2 },
          { instruction: "Cook noodles according to package directions. Drain well.", order: 3 },
          { instruction: "Fry corn in butter in a small pan over high heat until charred in spots, about 3 minutes.", order: 4 },
          { instruction: "Divide noodles between bowls. Ladle hot broth over. Top with halved eggs, charred corn, green onions, nori, and sesame seeds.", order: 5 },
        ],
      },
      {
        title: "Beef Bourguignon",
        description:
          "The definitive French braised beef — chunks of chuck slow-cooked in red wine with pearl onions, mushrooms, and lardons until the meat is fall-apart tender and the sauce is glossy and deeply rich.",
        prepTimeMinutes: 30,
        cookTimeMinutes: 180,
        servings: 6,
        tags: ["french", "beef", "dinner", "braised", "winter"],
        groups: [
          {
            label: "Braise",
            default: false,
            order: 0,
            ingredients: [
              { label: "beef chuck, cut into 4cm cubes", value: 1.2, unit: "KILOGRAM", order: 0 },
              { label: "lardons or thick-cut bacon, diced", value: 200, unit: "GRAM", order: 1 },
              { label: "dry red wine (Burgundy or Pinot Noir)", value: 750, unit: "MILLILITER", order: 2 },
              { label: "beef stock", value: 500, unit: "MILLILITER", order: 3 },
              { label: "tomato paste", value: 2, unit: "TABLESPOON", order: 4 },
              { label: "garlic cloves, crushed", value: 4, unit: "NONE", order: 5 },
              { label: "fresh thyme sprigs", value: 4, unit: "NONE", order: 6 },
              { label: "bay leaves", value: 2, unit: "NONE", order: 7 },
              { label: "all-purpose flour", value: 2, unit: "TABLESPOON", order: 8 },
            ],
          },
          {
            label: "Garnish",
            default: false,
            order: 1,
            ingredients: [
              { label: "pearl onions, peeled", value: 250, unit: "GRAM", order: 0 },
              { label: "cremini mushrooms, quartered", value: 300, unit: "GRAM", order: 1 },
              { label: "butter", value: 3, unit: "TABLESPOON", order: 2 },
            ],
          },
        ],
        steps: [
          { instruction: "Pat beef dry, season generously. Brown in batches in a heavy Dutch oven with oil over high heat — don't crowd the pan. Set aside.", order: 0 },
          { instruction: "Cook lardons in the same pot until crispy. Add tomato paste and cook 1 minute, then sprinkle in flour and stir 2 minutes.", order: 1 },
          { instruction: "Return beef to pot. Add wine, stock, garlic, thyme, and bay leaves. Bring to a boil, then reduce to the lowest simmer. Cover and cook 2.5–3 hours until beef is tender.", order: 2 },
          { instruction: "Meanwhile, sauté pearl onions in 1 tbsp butter until golden, about 10 minutes. In another pan, sauté mushrooms in remaining butter over high heat until browned.", order: 3 },
          { instruction: "Remove beef. Strain sauce into a saucepan and reduce over high heat until it coats a spoon. Return beef, add onions and mushrooms, simmer together 5 minutes.", order: 4 },
          { instruction: "Serve over mashed potatoes, egg noodles, or crusty bread.", order: 5 },
        ],
      },
      {
        title: "Falafel with Tahini Sauce",
        description:
          "Crispy, herb-packed falafel made from dried chickpeas (never canned) with a golden crust and vibrant green interior. Served with a rich, lemony tahini sauce and stuffed into warm pita.",
        prepTimeMinutes: 30,
        cookTimeMinutes: 20,
        servings: 4,
        tags: ["middle eastern", "vegetarian", "vegan", "chickpeas", "lunch"],
        groups: [
          {
            label: "Falafel",
            default: false,
            order: 0,
            ingredients: [
              { label: "dried chickpeas, soaked overnight", value: 300, unit: "GRAM", order: 0 },
              { label: "fresh parsley", value: 1, unit: "CUP", order: 1 },
              { label: "fresh cilantro", value: 0.5, unit: "CUP", order: 2 },
              { label: "onion, roughly chopped", value: 0.5, unit: "NONE", order: 3 },
              { label: "garlic cloves", value: 4, unit: "NONE", order: 4 },
              { label: "cumin", value: 2, unit: "TEASPOON", order: 5 },
              { label: "coriander", value: 1, unit: "TEASPOON", order: 6 },
              { label: "baking powder", value: 1, unit: "TEASPOON", order: 7 },
              { label: "salt", value: 1.5, unit: "TEASPOON", order: 8 },
              { label: "oil, for frying", value: 500, unit: "MILLILITER", order: 9 },
            ],
          },
          {
            label: "Tahini Sauce",
            default: false,
            order: 1,
            ingredients: [
              { label: "tahini", value: 0.5, unit: "CUP", order: 0 },
              { label: "lemon juice", value: 3, unit: "TABLESPOON", order: 1 },
              { label: "garlic clove, minced", value: 1, unit: "NONE", order: 2 },
              { label: "ice cold water", value: 0.25, unit: "CUP", order: 3 },
              { label: "salt", value: 0.5, unit: "TEASPOON", order: 4 },
            ],
          },
        ],
        steps: [
          { instruction: "Drain soaked chickpeas well (do not use canned). Pulse in a food processor with parsley, cilantro, onion, garlic, spices, and salt until a coarse, sand-like texture forms. Do not over-process into a paste.", order: 0 },
          { instruction: "Add baking powder and mix. Refrigerate the mixture for 30 minutes — this helps it hold together.", order: 1 },
          { instruction: "Make tahini sauce: whisk tahini, lemon, garlic, and salt together — it will seize up. Slowly whisk in cold water until smooth and pourable.", order: 2 },
          { instruction: "Heat oil to 175°C (350°F) in a deep pan. Form falafel into balls or patties using wet hands or a falafel scoop.", order: 3 },
          { instruction: "Fry in batches for 3–4 minutes until deep golden brown. Drain on paper towels.", order: 4 },
          { instruction: "Serve in warm pita with tahini sauce, sliced tomato, cucumber, and pickled turnips.", order: 5 },
        ],
      },
      {
        title: "Butter Chicken (Murgh Makhani)",
        description:
          "The original — silky, mildly spiced tomato-butter sauce with smoky grilled chicken. Less sharp than tikka masala, more luxurious. A recipe that rewards time and good butter.",
        prepTimeMinutes: 40,
        cookTimeMinutes: 45,
        servings: 4,
        tags: ["indian", "chicken", "dinner", "curry"],
        groups: [
          {
            label: "Chicken Marinade",
            default: false,
            order: 0,
            ingredients: [
              { label: "chicken thighs, boneless", value: 800, unit: "GRAM", order: 0 },
              { label: "plain yogurt", value: 0.5, unit: "CUP", order: 1 },
              { label: "lemon juice", value: 2, unit: "TABLESPOON", order: 2 },
              { label: "kashmiri chili powder", value: 1, unit: "TABLESPOON", order: 3 },
              { label: "garam masala", value: 1, unit: "TEASPOON", order: 4 },
              { label: "cumin", value: 1, unit: "TEASPOON", order: 5 },
              { label: "garlic paste", value: 1, unit: "TABLESPOON", order: 6 },
              { label: "ginger paste", value: 1, unit: "TABLESPOON", order: 7 },
            ],
          },
          {
            label: "Makhani Sauce",
            default: false,
            order: 1,
            ingredients: [
              { label: "unsalted butter", value: 4, unit: "TABLESPOON", order: 0 },
              { label: "onion, roughly chopped", value: 1, unit: "NONE", order: 1 },
              { label: "garlic cloves", value: 6, unit: "NONE", order: 2 },
              { label: "fresh ginger", value: 2, unit: "TABLESPOON", order: 3 },
              { label: "whole canned tomatoes", value: 800, unit: "GRAM", order: 4 },
              { label: "heavy cream", value: 0.5, unit: "CUP", order: 5 },
              { label: "kashmiri chili powder", value: 1, unit: "TEASPOON", order: 6 },
              { label: "garam masala", value: 1.5, unit: "TEASPOON", order: 7 },
              { label: "sugar", value: 1, unit: "TEASPOON", order: 8 },
            ],
          },
        ],
        steps: [
          { instruction: "Combine all marinade ingredients with chicken. Cover and refrigerate at least 2 hours, preferably overnight.", order: 0 },
          { instruction: "Grill or broil chicken at high heat until charred in spots and cooked through, about 12–15 minutes. Rest 5 minutes, then cut into chunks.", order: 1 },
          { instruction: "For the sauce: melt butter in a heavy pot. Cook onion until golden, add garlic and ginger, cook 2 minutes. Add tomatoes and chili powder. Simmer 20 minutes.", order: 2 },
          { instruction: "Blend the sauce until completely smooth using an immersion or stand blender. Pass through a fine sieve for an extra silky result.", order: 3 },
          { instruction: "Return sauce to pot. Stir in cream, garam masala, and sugar. Simmer 5 minutes. Add chicken and simmer 10 more minutes. Finish with a knob of cold butter stirred in off the heat.", order: 4 },
          { instruction: "Serve with basmati rice and warm naan.", order: 5 },
        ],
      },
      {
        title: "Classic Margherita Pizza",
        description:
          "Neapolitan-style pizza with a blistered, chewy crust, bright San Marzano tomato sauce, fresh mozzarella, and basil. The simplest pizza is also the hardest to perfect — this recipe gets you there.",
        prepTimeMinutes: 30,
        cookTimeMinutes: 12,
        servings: 2,
        tags: ["italian", "pizza", "dinner", "vegetarian", "baking"],
        groups: [
          {
            label: "Dough",
            default: false,
            order: 0,
            ingredients: [
              { label: "bread flour (or 00 flour)", value: 500, unit: "GRAM", order: 0 },
              { label: "warm water (32°C)", value: 325, unit: "MILLILITER", order: 1 },
              { label: "instant yeast", value: 1, unit: "TEASPOON", order: 2 },
              { label: "salt", value: 10, unit: "GRAM", order: 3 },
              { label: "olive oil", value: 1, unit: "TABLESPOON", order: 4 },
            ],
          },
          {
            label: "Toppings",
            default: false,
            order: 1,
            ingredients: [
              { label: "San Marzano tomatoes, crushed by hand", value: 400, unit: "GRAM", order: 0 },
              { label: "fresh mozzarella, torn", value: 250, unit: "GRAM", order: 1 },
              { label: "fresh basil leaves", value: 15, unit: "NONE", order: 2 },
              { label: "olive oil, to finish", value: 2, unit: "TABLESPOON", order: 3 },
              { label: "flaky salt", value: 0.5, unit: "TEASPOON", order: 4 },
            ],
          },
        ],
        steps: [
          { instruction: "Combine flour, yeast, and salt. Add water and olive oil. Mix until shaggy, then knead 10 minutes until smooth and elastic. Divide into 2 balls. Cover and let rise 2 hours at room temperature, or overnight in the fridge.", order: 0 },
          { instruction: "Place a baking steel or heavy baking sheet on the top rack. Preheat oven to its maximum temperature (ideally 275°C / 525°F) for at least 45 minutes.", order: 1 },
          { instruction: "Season crushed tomatoes with salt only. Do not cook the sauce.", order: 2 },
          { instruction: "On a floured surface, stretch (don't roll) a dough ball into a thin 30cm circle by gently pressing from the center outward, leaving a thicker border for the crust.", order: 3 },
          { instruction: "Transfer to a lightly floured pizza peel or parchment. Spread a thin layer of tomato sauce. Scatter mozzarella.", order: 4 },
          { instruction: "Slide onto the hot steel. Bake 8–12 minutes until the crust is blistered and the cheese is golden in spots. Top with fresh basil and a drizzle of olive oil immediately out of the oven.", order: 5 },
        ],
      },
      {
        title: "Chocolate Lava Cakes",
        description:
          "Individual chocolate cakes with a molten, flowing center. They look impressive but take under 30 minutes and can be prepped days ahead. The secret is frozen ganache cores.",
        prepTimeMinutes: 20,
        cookTimeMinutes: 12,
        servings: 4,
        tags: ["dessert", "chocolate", "baking", "dinner party"],
        groups: [
          {
            label: "Lava Cakes",
            default: false,
            order: 0,
            ingredients: [
              { label: "dark chocolate (70%), chopped", value: 200, unit: "GRAM", order: 0 },
              { label: "unsalted butter", value: 100, unit: "GRAM", order: 1 },
              { label: "large eggs", value: 4, unit: "NONE", order: 2 },
              { label: "egg yolks", value: 2, unit: "NONE", order: 3 },
              { label: "caster sugar", value: 80, unit: "GRAM", order: 4 },
              { label: "all-purpose flour", value: 40, unit: "GRAM", order: 5 },
              { label: "pinch of salt", value: 1, unit: "NONE", order: 6 },
              { label: "butter and cocoa, to line ramekins", value: 1, unit: "NONE", order: 7 },
            ],
          },
        ],
        steps: [
          { instruction: "Melt chocolate and butter together over a double boiler or in 30-second microwave bursts, stirring between each. Cool slightly.", order: 0 },
          { instruction: "Whisk eggs, yolks, and sugar together until slightly pale and thickened, about 2 minutes.", order: 1 },
          { instruction: "Fold chocolate mixture into eggs, then fold in flour and salt until just combined.", order: 2 },
          { instruction: "Butter 4 ramekins thoroughly and dust with cocoa. Divide batter evenly. At this point you can refrigerate for up to 2 days.", order: 3 },
          { instruction: "Preheat oven to 200°C (400°F). Bake ramekins on a tray for 11–12 minutes — the edges should be set but the center should still jiggle.", order: 4 },
          { instruction: "Run a knife around the edge, invert onto a plate, and serve immediately with vanilla ice cream or whipped cream.", order: 5 },
        ],
      },
      {
        title: "Thai Green Curry",
        description:
          "Fragrant, coconut-rich Thai green curry with tender chicken, crisp vegetables, and fresh aromatics. The key is blooming the paste in hot oil before anything else goes in.",
        prepTimeMinutes: 15,
        cookTimeMinutes: 25,
        servings: 4,
        tags: ["thai", "curry", "chicken", "dinner", "coconut"],
        groups: [
          {
            label: "",
            default: true,
            order: 0,
            ingredients: [
              { label: "coconut oil", value: 2, unit: "TABLESPOON", order: 0 },
              { label: "green curry paste", value: 3, unit: "TABLESPOON", order: 1 },
              { label: "coconut milk, full-fat", value: 800, unit: "MILLILITER", order: 2 },
              { label: "chicken thighs, sliced", value: 600, unit: "GRAM", order: 3 },
              { label: "Thai eggplant, quartered", value: 200, unit: "GRAM", order: 4 },
              { label: "snap peas", value: 150, unit: "GRAM", order: 5 },
              { label: "fish sauce", value: 2, unit: "TABLESPOON", order: 6 },
              { label: "palm sugar or brown sugar", value: 1, unit: "TABLESPOON", order: 7 },
              { label: "fresh lime juice", value: 2, unit: "TABLESPOON", order: 8 },
              { label: "kaffir lime leaves, torn", value: 4, unit: "NONE", order: 9 },
              { label: "Thai basil leaves", value: 0.5, unit: "CUP", order: 10 },
            ],
          },
        ],
        steps: [
          { instruction: "Heat coconut oil in a wok or large pan over high heat. Add curry paste and fry, stirring constantly, for 2 minutes until fragrant and the oil separates.", order: 0 },
          { instruction: "Pour in half the coconut milk. Bring to a boil and cook 3 minutes, stirring, until the sauce thickens slightly.", order: 1 },
          { instruction: "Add chicken and cook 5 minutes, stirring often, until nearly cooked through.", order: 2 },
          { instruction: "Add remaining coconut milk, eggplant, and lime leaves. Simmer 8 minutes.", order: 3 },
          { instruction: "Add snap peas, fish sauce, and sugar. Cook 2 more minutes. Taste and balance with lime juice.", order: 4 },
          { instruction: "Remove from heat, stir in Thai basil. Serve over jasmine rice.", order: 5 },
        ],
      },
      {
        title: "Sourdough Bread",
        description:
          "An open-crumb, deeply flavored sourdough loaf with a crackly crust. This schedule fits around a normal day — mix in the morning, bake the next morning. An active starter is the only requirement.",
        prepTimeMinutes: 40,
        cookTimeMinutes: 50,
        servings: 8,
        tags: ["baking", "bread", "sourdough", "vegan"],
        groups: [
          {
            label: "Dough",
            default: false,
            order: 0,
            ingredients: [
              { label: "bread flour", value: 450, unit: "GRAM", order: 0 },
              { label: "whole wheat flour", value: 50, unit: "GRAM", order: 1 },
              { label: "water (30°C)", value: 375, unit: "MILLILITER", order: 2 },
              { label: "active sourdough starter (100% hydration)", value: 100, unit: "GRAM", order: 3 },
              { label: "fine sea salt", value: 10, unit: "GRAM", order: 4 },
            ],
          },
        ],
        steps: [
          { instruction: "Mix flours and 350ml water (hold back 25ml). Let rest 45 minutes (autolyse). Mix starter with remaining water, add to dough, then add salt. Squeeze and fold until fully incorporated.", order: 0 },
          { instruction: "Bulk fermentation: over the next 4 hours at room temperature (24°C), perform 4 sets of stretch-and-folds, 30 minutes apart. The dough is ready when it's grown ~50% and feels airy.", order: 1 },
          { instruction: "Turn dough onto an unfloured surface. Shape into a tight round by folding the edges toward the center, then flipping and dragging toward you to build surface tension.", order: 2 },
          { instruction: "Place seam-side up in a floured banneton or bowl lined with a floured cloth. Cover and refrigerate overnight (8–16 hours).", order: 3 },
          { instruction: "Preheat oven with a Dutch oven inside to 250°C (480°F) for 45 minutes. Turn cold dough onto parchment, score the top with a razor at a 30° angle.", order: 4 },
          { instruction: "Bake covered for 20 minutes, then uncover and bake 25–30 more minutes until the crust is deep mahogany. Cool on a wire rack for at least 1 hour before slicing.", order: 5 },
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
        userId: string;
        title: string;
        description: string;
        servings: number | null;
        prepTimeMinutes: number | null;
        cookTimeMinutes: number | null;
        tags: string[];
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        publishedAt: Date | null;
      };
      const { query, cursor: offset, limit } = input;
      const threshold = query.length > 0 ? 0.3 : -1;

      const rows = await db.$queryRaw<Row[]>`
        SELECT r.id, r."userId", r.title, r.description, r.servings, r."prepTimeMinutes", r."cookTimeMinutes", r.tags, r."imageUrl", r."createdAt", r."updatedAt", r."publishedAt",
          GREATEST(
            MAX(word_similarity(${query}, tag_val)) * 3,
            word_similarity(${query}, r.title) * 2,
            word_similarity(${query}, r.description)
          ) AS score,
          COALESCE(AVG(rt.value), 0) AS avg_rating
        FROM "Recipe" r
        LEFT JOIN LATERAL unnest(r.tags) AS tag_val ON true
        LEFT JOIN "Rating" rt ON rt."recipeId" = r.id
        WHERE r."publishedAt" IS NOT NULL
        GROUP BY r.id, r."userId", r.title, r.description, r.servings, r."prepTimeMinutes", r."cookTimeMinutes", r.tags, r."imageUrl", r."createdAt", r."updatedAt", r."publishedAt"
        HAVING GREATEST(
          MAX(word_similarity(${query}, tag_val)),
          word_similarity(${query}, r.title),
          word_similarity(${query}, r.description)
        ) > ${threshold}
        ORDER BY avg_rating DESC, score DESC
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
