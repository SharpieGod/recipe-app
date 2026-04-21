import type { inferRouterOutputs } from "@trpc/server";
import type {
  Ingredient,
  IngredientGroup,
  Prisma,
  Recipe,
  Step,
  StepGroup,
} from "generated/prisma";
import type { AppRouter } from "./server/api/root";

export type RecipeIncluded = Prisma.RecipeGetPayload<{
  include: {
    ingredientGroups: { include: { ingredients: true } };
    stepGroups: { include: { steps: true } };
  };
}>;
export type RecipeRating = RouterOutputs["recipe"]["getRecipeRating"];

type RouterOutputs = inferRouterOutputs<AppRouter>;
