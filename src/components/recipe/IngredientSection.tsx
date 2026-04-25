"use client";

import React from "react";
import type { RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import { GripVertical } from "lucide-react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRecipeEdit } from "./RecipeEditContext";
import { IngredientEdit } from "./IngredientEdit";

export const DroppableIngredientList = ({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) => {
  const { setNodeRef } = useDroppable({
    id: groupId,
    data: { type: "group" },
  });
  return (
    <div ref={setNodeRef} className="min-h-4">
      {children}
    </div>
  );
};

export const IngredientSectionDragPreview = ({
  group,
}: {
  group: RecipeIncluded["ingredientGroups"][number];
}) => {
  return (
    <div className="bg-background-50 flex items-center gap-3 rounded-lg border border-black/10 p-4 shadow-lg">
      <GripVertical className="text-background-300 size-6 shrink-0" />
      <div className="flex items-center gap-2">
        <span className="">{group.label || "Untitled section"}</span>
        <span className="text-text-500 text-sm">
          {group.ingredients.length}{" "}
          {group.ingredients.length === 1 ? "ingredient" : "ingredients"}
        </span>
      </div>
    </div>
  );
};

export const IngredientSection = ({
  group,
}: {
  group: RecipeIncluded["ingredientGroups"][number];
}) => {
  const { localRecipe, setLocalRecipe, focusedInputId, setFocusedInputId } =
    useRecipeEdit();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ id: group.id, data: { type: "section" } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: [transition, "opacity 200ms ease"].filter(Boolean).join(", "),
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  const ingredientIsOver =
    isOver && active?.data.current?.type === "ingredient";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-background-50 flex w-fit flex-col gap-4 rounded-lg border p-4 ${
        ingredientIsOver ? "border-accent-500/50" : "border-black/10"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          className="text-background-300 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder section"
        >
          <GripVertical className="size-6" />
        </button>
        <Input
          wrapperClassName="w-full"
          className="w-full max-w-60"
          value={group.label}
          label="Section Label"
          ref={(el: HTMLInputElement | null) => {
            if (el && focusedInputId === "_is_" + group.id) {
              el.focus();
              setFocusedInputId(null);
            }
          }}
          onChange={(e) => {
            setLocalRecipe({
              ...localRecipe,
              ingredientGroups: localRecipe.ingredientGroups.map((gr) =>
                gr.id === group.id ? { ...gr, label: e.target.value } : gr,
              ),
            });
          }}
        />
      </div>

      <SortableContext
        items={group.ingredients
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {group.ingredients.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {group.ingredients
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((i) => (
                <IngredientEdit key={i.id} ingredient={i} />
              ))}
          </ul>
        ) : (
          <div className="text-text-500 py-2 text-center text-sm">
            Drop ingredients here
          </div>
        )}
      </SortableContext>
    </li>
  );
};
