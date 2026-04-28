"use client";

import React from "react";
import type { RecipeIncluded } from "~/types";
import Input from "../../generic/Input";
import { GripVertical, Trash2 } from "lucide-react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRecipeEdit } from "./RecipeEditContext";
import { IngredientEdit } from "./IngredientEdit";
import { AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { useGetResolvedId } from "~/hooks/useResolvedId";

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
    <div className="bg-background-50 flex items-center gap-3 rounded-xl border border-black/10 p-4 shadow-lg">
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
  const getResolvedId = useGetResolvedId();

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
    transition,
  };

  const ingredientIsOver =
    isOver && active?.data.current?.type === "ingredient";

  const utils = api.useUtils();

  const { mutate: del } = api.ingredientGroup.delete.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) return;

      const defaultSectionId = localRecipe.ingredientGroups.find(
        (g) => g.default,
      )?.id;
      if (!defaultSectionId) return;

      const sectionToDelete = localRecipe.ingredientGroups.find(
        (g) => g.id === group.id, // use local id, not variables.id
      );
      if (!sectionToDelete) return;

      const ingredients = sectionToDelete.ingredients;

      setLocalRecipe((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups
            .map((g) =>
              g.id === defaultSectionId
                ? { ...g, ingredients: [...g.ingredients, ...ingredients] }
                : g,
            )
            .filter((g) => g.id !== group.id), // also use local id here
        };
      });

      utils.recipe.get.setData({ id: group.recipeId }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups
            .map((g) =>
              g.id === defaultSectionId
                ? { ...g, ingredients: [...g.ingredients, ...ingredients] }
                : g,
            )
            .filter((g) => g.id !== group.id),
        };
      });
    },
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.3 : 1,
        transition: [style.transition, "opacity 500ms ease"]
          .filter(Boolean)
          .join(", "),
      }}
      className={`bg-background-50 relative flex w-fit min-w-90 flex-col gap-4 rounded-xl border p-4 ${
        ingredientIsOver ? "border-accent-500/50" : "border-black/10"
      }`}
    >
      <button
        className="absolute top-4 right-4 cursor-pointer"
        onClick={() => {
          const realId = getResolvedId(group.id);

          if (!realId) {
            return;
          }

          del({ id: realId });
        }}
        title={`Delete ${group.label}`}
      >
        <Trash2
          className="text-text-300 hover:text-text-400 transition-colors"
          size={20}
        />
      </button>
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
            <AnimatePresence initial={false}>
              {group.ingredients
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((i) => (
                  <IngredientEdit key={i.id} ingredient={i} />
                ))}
            </AnimatePresence>
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
