import type { inferRouterOutputs } from "@trpc/server";
import type {
  Ingredient,
  IngredientGroup,
  Prisma,
  Recipe,
  Step,
  StepGroup,
  Unit,
} from "generated/prisma";

export const unitLabel = (unit: Unit): string =>
  unit
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
import type { AppRouter } from "./server/api/root";

export type RecipeIncluded = Prisma.RecipeGetPayload<{
  include: {
    ingredientGroups: { include: { ingredients: true } };
    stepGroups: { include: { steps: true } };
  };
}>;

export type RecipeRating = RouterOutputs["recipe"]["getRating"];

type RouterOutputs = inferRouterOutputs<AppRouter>;
