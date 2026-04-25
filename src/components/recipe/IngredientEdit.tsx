"use client";

import React from "react";
import { type Ingredient, Unit } from "generated/prisma";
import { unitLabel } from "~/types";
import Input from "../generic/Input";
import SelectPopdown from "../generic/SelectPopdown";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRecipeEdit } from "./RecipeEditContext";

export const IngredientDragPreview = ({ ingredient }: { ingredient: Ingredient }) => {
  return (
    <li className="bg-background-100 flex w-120 items-center gap-2 rounded-lg p-2 shadow-md">
      <GripVertical className="text-background-300 size-5 shrink-0" />
      <span className="w-14 shrink-0 text-sm">{ingredient.value}</span>
      <span className="text-text-500 shrink-0 text-sm">
        {unitLabel(ingredient.unit as Unit)}
      </span>
      <span className="flex-1">{ingredient.label}</span>
    </li>
  );
};

export const IngredientEdit = ({ ingredient }: { ingredient: Ingredient }) => {
  const { localRecipe, setLocalRecipe, focusedInputId, setFocusedInputId } = useRecipeEdit();
  const [valueStr, setValueStr] = React.useState(String(ingredient.value));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ingredient.id,
    data: { type: "ingredient" },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: [transition, "opacity 200ms ease"].filter(Boolean).join(", "),
    opacity: isDragging ? 0 : 1,
  };

  const handleValueChange = (str: string) => {
    if (!/^\d*\.?\d*(\/\d*\.?\d*)?$/.test(str)) return;
    setValueStr(str);
    let parsed: number;
    if (str === "") {
      parsed = 0;
    } else if (str.includes("/")) {
      const [num, den] = str.split("/").map(parseFloat);
      parsed = !isNaN(num!) && !isNaN(den!) && den !== 0 ? num! / den! : NaN;
    } else {
      parsed = parseFloat(str);
    }
    if (!isNaN(parsed)) {
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-background-100 flex w-120 max-w-full items-center gap-2 rounded-lg p-2"
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
        entries={Object.values(Unit)
          .filter((u) => u != "NONE")
          .map((s) => ({ label: unitLabel(s), key: s }))}
        onSelected={(key) => {
          setLocalRecipe({
            ...localRecipe,
            ingredientGroups: localRecipe.ingredientGroups.map((g) => ({
              ...g,
              ingredients: g.ingredients.map((i) =>
                i.id === ingredient.id ? { ...i, unit: key as Unit } : i,
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
    </li>
  );
};
