"use client";

import React from "react";
import { type Ingredient, Unit } from "generated/prisma";
import { unitLabel } from "~/types";
import Input from "../../generic/Input";
import SelectPopdown from "../../generic/SelectPopdown";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRecipeEdit } from "./RecipeEditContext";
import { api } from "~/trpc/react";
import { useGetResolvedId } from "~/hooks/useResolvedId";
export const IngredientDragPreview = ({
  ingredient,
}: {
  ingredient: Ingredient;
}) => {
  return (
    <li className="bg-background-100 flex w-120 items-center gap-2 rounded-lg p-2 shadow-md">
      <GripVertical className="text-background-300 size-5 shrink-0" />
      <span className="w-14 shrink-0 text-sm">
        {isImperial(ingredient.unit as Unit)
          ? toMixedFraction(ingredient.value)
          : String(ingredient.value)}
      </span>
      <span className="text-text-500 shrink-0 text-sm">
        {unitLabel(ingredient.unit as Unit)}
      </span>
      <span className="flex-1">{ingredient.label}</span>
    </li>
  );
};

const IMPERIAL_UNITS = new Set<Unit>([
  "TEASPOON",
  "TABLESPOON",
  "FLUID_OUNCE",
  "CUP",
  "PINT",
  "QUART",
  "OUNCE",
  "POUND",
]);

export const isImperial = (unit: Unit) => IMPERIAL_UNITS.has(unit);

export function toMixedFraction(x: number): string {
  if (x === 0) return "0";
  const whole = Math.floor(x);
  const frac = x - whole;
  if (frac < 0.005) return String(whole);
  const fracStr = simpleFraction(frac);
  return whole > 0 ? `${whole} ${fracStr}` : fracStr;
}

export function simpleFraction(x: number, maxDen: number = 9): string {
  let bestNum = 0;
  let bestDen = 1;
  let bestErr = Infinity;

  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(x * d);
    const err = Math.abs(x - n / d);
    if (err < bestErr) {
      bestErr = err;
      bestNum = n;
      bestDen = d;
    }
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const g = gcd(Math.abs(bestNum), bestDen);

  return `${bestNum / g}/${bestDen / g}`;
}

export const IngredientEdit = ({ ingredient }: { ingredient: Ingredient }) => {
  const getResolvedId = useGetResolvedId();
  const { localRecipe, setLocalRecipe, focusedInputId, setFocusedInputId } =
    useRecipeEdit();
  const [valueStr, setValueStr] = React.useState(
    isImperial(ingredient.unit as Unit)
      ? toMixedFraction(ingredient.value)
      : String(ingredient.value),
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ingredient.id,
    data: { type: "ingredient", groupId: ingredient.ingredientGroupId },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: [transition, "opacity 200ms ease"].filter(Boolean).join(", "),
    opacity: isDragging ? 0 : 1,
  };

  const handleValueChange = (str: string) => {
    if (!/^\d*\.?\d*(\s\d*\.?\d*(\/\d*\.?\d*)?|\/\d*\.?\d*)?$/.test(str))
      return;
    setValueStr(str);
    let parsed: number;
    if (str === "") {
      parsed = 0;
    } else if (str.includes(" ")) {
      const [wholeStr, fracStr] = str.split(" ");
      const whole = parseFloat(wholeStr!);
      if (fracStr!.includes("/")) {
        const [num, den] = fracStr!.split("/").map(parseFloat);
        parsed =
          !isNaN(whole) && !isNaN(num!) && !isNaN(den!) && den !== 0
            ? whole + num! / den!
            : NaN;
      } else {
        parsed = NaN;
      }
    } else if (str.includes("/")) {
      const [num, den] = str.split("/").map(parseFloat);
      parsed = !isNaN(num!) && !isNaN(den!) && den !== 0 ? num! / den! : NaN;
    } else {
      parsed = parseFloat(str);
    }
    if (!isNaN(parsed)) {
      parsed = +parsed.toFixed(2);

      setLocalRecipe({
        ...localRecipe,
        ingredientGroups: localRecipe.ingredientGroups.map((g) => ({
          ...g,
          ingredients: g.ingredients.map((i) =>
            i.id === ingredient.id ? { ...i, value: parsed } : i,
          ),
        })),
      });
    }
  };

  const utils = api.useUtils();

  const { mutate: del } = api.ingredient.delete.useMutation({
    onMutate(variables, context) {
      setLocalRecipe((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups.map((g) => ({
            ...g,
            ingredients: g.ingredients.filter((i) => i.id !== ingredient.id),
          })),
        };
      });

      utils.recipe.get.setData({ id: localRecipe.id }, (prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups.map((g) => ({
            ...g,
            ingredients: g.ingredients.filter((i) => i.id !== ingredient.id),
          })),
        };
      });
    },
  });

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-background-100 flex w-120 max-w-full items-center gap-2 rounded-lg p-2 text-sm"
    >
      <button
        type="button"
        className="text-background-300 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder ingredient"
      >
        <GripVertical className="size-5 shrink-0" />
      </button>
      <Input
        className="w-14 max-w-full"
        value={valueStr}
        onChange={(e) => handleValueChange(e.target.value)}
      />
      <SelectPopdown
        className="w-full"
        entries={Object.values(Unit).map((s) => ({ label: unitLabel(s), key: s }))}
        onSelected={(key) => {
          const newUnit = key as Unit;
          const cur = localRecipe.ingredientGroups
            .flatMap((g) => g.ingredients)
            .find((i) => i.id === ingredient.id);
          const val = cur?.value ?? ingredient.value;
          setValueStr(isImperial(newUnit) ? toMixedFraction(val) : String(val));
          setLocalRecipe({
            ...localRecipe,
            ingredientGroups: localRecipe.ingredientGroups.map((g) => ({
              ...g,
              ingredients: g.ingredients.map((i) =>
                i.id === ingredient.id ? { ...i, unit: newUnit } : i,
              ),
            })),
          });
        }}
        selectedEntryKey={ingredient.unit}
        emptySelectText="Pick a unit"
      />
      <Input
        ref={(el: HTMLInputElement | null) => {
          if (el && focusedInputId === "_in_" + ingredient.id) {
            el.focus();
            setFocusedInputId(null);
          }
        }}
        value={ingredient.label}
        placeholder="Ingredient label"
        className="w-full"
        wrapperClassName="max-w-full w-200 grow"
        onChange={(e) =>
          setLocalRecipe({
            ...localRecipe,
            ingredientGroups: localRecipe.ingredientGroups.map((g) => ({
              ...g,
              ingredients: g.ingredients.map((i) =>
                i.id === ingredient.id ? { ...i, label: e.target.value } : i,
              ),
            })),
          })
        }
      />
      <button
        onClick={() => {
          const realId = getResolvedId(ingredient.id);
          if (!realId) return;

          del({ id: realId });
        }}
        className="cursor-pointer"
      >
        <Trash2
          size={16}
          className="text-text-400 hover:text-text-500 shrink-0 transition-colors"
        />
      </button>
    </li>
  );
};
