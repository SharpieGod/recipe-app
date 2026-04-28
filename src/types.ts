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

// Simple kitchen-friendly factors (not scientifically precise)
const IMPERIAL_TO_METRIC_ML: Record<
  Exclude<Imperical, "OUNCE" | "POUND">,
  { factor: number; unit: Metric }
> = {
  TEASPOON: { factor: 5, unit: "MILLILITER" }, // 1 tsp  = 5 ml
  TABLESPOON: { factor: 15, unit: "MILLILITER" }, // 1 tbsp = 15 ml
  FLUID_OUNCE: { factor: 30, unit: "MILLILITER" }, // 1 fl oz = 30 ml
  CUP: { factor: 250, unit: "MILLILITER" }, // 1 cup  = 250 ml
  PINT: { factor: 500, unit: "MILLILITER" }, // 1 pt   = 500 ml
  QUART: { factor: 1, unit: "LITER" }, // 1 qt   = 1 L
};

export function imperialToMetric(
  value: number,
  unit: Imperical,
): { value: number; unit: Metric } {
  if (unit === "OUNCE") return { value: value * 30, unit: "GRAM" }; // 1 oz = 30 g
  if (unit === "POUND") return { value: value * 0.45, unit: "KILOGRAM" }; // 1 lb = 0.45 kg
  const conv = IMPERIAL_TO_METRIC_ML[unit];
  return { value: value * conv.factor, unit: conv.unit };
}

export function metricToImperial(
  value: number,
  unit: Metric,
): { value: number; unit: Imperical } {
  switch (unit) {
    case "MILLILITER":
      return { value: value / 5, unit: "TEASPOON" }; // 5 ml = 1 tsp
    case "LITER":
      return { value: value, unit: "QUART" }; // 1 L  = 1 qt
    case "GRAM":
      return { value: value / 30, unit: "OUNCE" }; // 30 g = 1 oz
    case "KILOGRAM":
      return { value: value / 0.45, unit: "POUND" }; // 0.45 kg = 1 lb
  }
}

// Rounds to a cooking-sensible precision for each metric unit:
//   ml  → nearest 1     (e.g. 14.79 → 15)
//   L   → nearest 0.05  (e.g. 0.946 → 0.95)
//   g   → nearest 1     (e.g. 28.35 → 28)
//   kg  → nearest 0.01  (e.g. 0.454 → 0.45)
export function roundMetric(value: number, unit: Metric): number {
  switch (unit) {
    case "MILLILITER":
      return Math.round(value);
    case "LITER":
      return Math.round(value / 0.05) * 0.05;
    case "GRAM":
      return Math.round(value);
    case "KILOGRAM":
      return Math.round(value * 100) / 100;
  }
}
