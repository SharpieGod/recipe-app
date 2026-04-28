import type { inferRouterOutputs } from "@trpc/server";
import type {
  Ingredient,
  IngredientGroup,
  Prisma,
  Recipe,
  Step,
  Unit,
} from "generated/prisma";

export const UNIT_LABELS: Record<Unit, string> = {
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
    user: true;
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

export type Metric = Extract<
  Unit,
  "MILLILITER" | "LITER" | "GRAM" | "KILOGRAM"
>;

const IMPERIAL_TO_METRIC_ML: Record<
  Exclude<Imperical, "OUNCE" | "POUND">,
  { factor: number; unit: Metric }
> = {
  TEASPOON: { factor: 4.92892, unit: "MILLILITER" },
  TABLESPOON: { factor: 14.7868, unit: "MILLILITER" },
  FLUID_OUNCE: { factor: 29.5735, unit: "MILLILITER" },
  CUP: { factor: 236.588, unit: "MILLILITER" },
  PINT: { factor: 473.176, unit: "MILLILITER" },
  QUART: { factor: 0.946353, unit: "LITER" },
};

export function imperialToMetric(
  value: number,
  unit: Imperical,
): { value: number; unit: Metric } {
  if (unit === "OUNCE") return { value: value * 28.3495, unit: "GRAM" };
  if (unit === "POUND") return { value: value * 0.453592, unit: "KILOGRAM" };
  const conv = IMPERIAL_TO_METRIC_ML[unit];
  return { value: value * conv.factor, unit: conv.unit };
}

export function metricToImperial(
  value: number,
  unit: Metric,
): { value: number; unit: Imperical } {
  switch (unit) {
    case "MILLILITER":
      return { value: value * 0.202884, unit: "TEASPOON" };
    case "LITER":
      return { value: value * 1.05669, unit: "QUART" };
    case "GRAM":
      return { value: value * 0.035274, unit: "OUNCE" };
    case "KILOGRAM":
      return { value: value * 2.20462, unit: "POUND" };
  }
}

// Rounds to a cooking-sensible precision for each metric unit:
//   ml  → nearest 1     (e.g. 14.79 → 15)
//   L   → nearest 0.05  (e.g. 0.946 → 0.95)
//   g   → nearest 1     (e.g. 28.35 → 28)
//   kg  → nearest 0.01  (e.g. 0.454 → 0.45)
export function roundMetric(value: number, unit: Metric): number {
  switch (unit) {
    case "MILLILITER": return Math.round(value);
    case "LITER":      return Math.round(value / 0.05) * 0.05;
    case "GRAM":       return Math.round(value);
    case "KILOGRAM":   return Math.round(value * 100) / 100;
  }
}
