import type { inferRouterOutputs } from "@trpc/server";
import type {
  Ingredient,
  IngredientGroup,
  Prisma,
  Recipe,
  Step,
  Unit,
} from "generated/prisma";

const UNIT_LABELS: Record<Unit, string> = {
  NONE: "",
  TEASPOON: "tsp",
  TABLESPOON: "tbsp",
  FLUID_OUNCE: "fl oz",
  CUP: "cup",
  PINT: "pt",
  QUART: "qt",
  MILLILITER: "ml",
  LITER: "L",
  OUNCE: "oz",
  POUND: "lb",
  GRAM: "g",
  KILOGRAM: "kg",
};

export const unitLabel = (unit: Unit): string => {
  if (unit == "NONE") {
    return "No unit";
  }
  return (
    unit
      .split("_")
      .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") +
    " (" +
    UNIT_LABELS[unit] +
    ")"
  );
};

import type { AppRouter } from "./server/api/root";

export type RecipeIncluded = Prisma.RecipeGetPayload<{
  include: {
    ingredientGroups: { include: { ingredients: true } };
    steps: true;
  };
}>;

export type RecipeRating = RouterOutputs["recipe"]["getRating"];

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Imperical = Extract<
  Unit,
  | "TEASPOON"
  | "TABLESPOON"
  | "FLUID_OUNCE"
  | "CUP"
  | "PINT"
  | "QUART"
  | "OUNCE"
  | "POUND"
>;
