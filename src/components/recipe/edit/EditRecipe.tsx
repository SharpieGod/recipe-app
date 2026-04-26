"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { type RecipeIncluded } from "~/types";
import Input from "../../generic/Input";
import { useDebounce } from "~/hooks/useDebounce";
import TextArea from "../../generic/Textarea";
import { type Ingredient } from "generated/prisma";
import { useGetResolvedId, useSetResolvedId } from "~/hooks/useResolvedId";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  rectIntersection,
  getFirstCollision,
  pointerWithin,
  closestCenter,
  defaultDropAnimationSideEffects,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RecipeEditContext } from "./RecipeEditContext";
import { IngredientEdit, IngredientDragPreview } from "./IngredientEdit";
import {
  DroppableIngredientList,
  IngredientSection,
  IngredientSectionDragPreview,
} from "./IngredientSection";
import Container from "../../generic/Container";
import { AnimatePresence } from "framer-motion";

type Props = {
  recipeId: string;
};

const EditRecipe = ({ recipeId }: Props) => {
  const utils = api.useUtils();
  const setResolvedId = useSetResolvedId();
  const getResolvedId = useGetResolvedId();

  const [inputFocusId, setInputFocusId] = useState<string | null>(null);

  // -- Recipe --
  const updateRecipeFull = () => {
    if (!debouncedRecipeValues || !serverRecipe) return;
    const values = debouncedRecipeValues;
    updateRecipe(values);

    const serverIngMap = new Map<
      string | null,
      Ingredient & { ingredientGroupId: string }
    >(
      serverRecipe.ingredientGroups.flatMap((g) =>
        g.ingredients.map(
          (i) =>
            [getResolvedId(i.id), { ...i, ingredientGroupId: g.id }] as [
              string | null,
              Ingredient & { ingredientGroupId: string },
            ],
        ),
      ),
    );

    values.ingredientGroups.forEach((g) => {
      const realGroupId = getResolvedId(g.id);
      if (!realGroupId) return;

      const serverGroup = serverRecipe.ingredientGroups.find(
        (gr) => gr.id == realGroupId,
      );

      const hasChanged =
        !serverGroup ||
        serverGroup.label !== g.label ||
        serverGroup.order !== g.order;

      if (hasChanged) {
        updateIngredientSection({
          id: realGroupId,
          label: g.label,
          order: g.order,
        });
      }

      g.ingredients.forEach((i) => {
        const realIngredientId = getResolvedId(i.id);
        if (!realIngredientId) return;

        const serverIngredient = serverIngMap.get(realIngredientId);

        const ingredientChanged =
          !serverIngredient ||
          serverIngredient.label !== i.label ||
          serverIngredient.unit !== i.unit ||
          serverIngredient.value !== i.value ||
          serverIngredient.order !== i.order ||
          serverIngredient.ingredientGroupId !== realGroupId;

        if (ingredientChanged) {
          updateIngredient({
            id: realIngredientId,
            label: i.label,
            unit: i.unit,
            value: i.value,
            order: i.order,
            ingredientGroupId: realGroupId,
          });
        }
      });
    });
  };

  const { data: serverRecipe } = api.recipe.get.useQuery({ id: recipeId });

  const [localRecipe, setLocalRecipe] = useState<RecipeIncluded | null>(null);

  useEffect(() => {
    if (localRecipe == null && serverRecipe) {
      setLocalRecipe(serverRecipe);
    }
  }, [serverRecipe]);

  const {
    mutate: updateRecipe,
    status: syncStatus,
    isSuccess,
    isError,
    isPending,
  } = api.recipe.update.useMutation({
    onMutate: (input) => {
      const prev_recipe = serverRecipe;
      if (!localRecipe || !prev_recipe) return;
      utils.recipe.get.setData({ id: recipeId }, { ...localRecipe });

      const { ingredientGroups, stepGroups, ...preview } = localRecipe;
      utils.recipe.getPreview.setData({ id: recipeId }, { ...preview });
      return prev_recipe;
    },
    onError(error, variables, prev_recipe, context) {
      utils.recipe.get.setData({ id: recipeId }, prev_recipe);
    },
    onSuccess(data, variables, onMutateResult, context) {},
  });

  const debouncedRecipeValues = useDebounce(localRecipe, 800);

  useEffect(() => {
    if (!debouncedRecipeValues || recipeIsSame) return;
    updateRecipeFull();
  }, [debouncedRecipeValues]);

  // -- Ingredient Groups --
  const { mutate: newIngredientSection } = api.ingredientGroup.new.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) return;
      const fakeId = "_tempid_" + crypto.randomUUID();

      const fakeIngredientGroup: RecipeIncluded["ingredientGroups"][number] = {
        recipeId: localRecipe.id,
        default: false,
        id: fakeId,
        label: variables.label,
        order: localRecipe.ingredientGroups.length,
        ingredients: [],
      };

      setLocalRecipe({
        ...localRecipe,
        ingredientGroups: [
          ...localRecipe.ingredientGroups,
          fakeIngredientGroup,
        ],
      });

      setInputFocusId("_is_" + fakeId);
      return { fakeId };
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (!onMutateResult?.fakeId || !data) return;
      setResolvedId(onMutateResult.fakeId, data.id);
    },
  });

  const {
    mutate: updateIngredientSection,
    isPending: ingredientGroupIsPending,
  } = api.ingredientGroup.update.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) return;

      utils.recipe.get.setData({ id: recipeId }, (prev) => {
        if (!prev) return;
        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups.map((g) =>
            g.id == variables.id
              ? { ...g, label: variables.label, order: variables.order }
              : g,
          ),
        };
      });
    },
  });

  const [newIngredientSectionLabel, setNewIngredientSectionLabel] =
    useState("");

  // -- Ingredients --
  const { mutate: newIngredient } = api.ingredient.new.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) return;
      const fakeId = "_tempid_" + crypto.randomUUID();

      const fakeIngredient: RecipeIncluded["ingredientGroups"][number]["ingredients"][number] =
        {
          recipeId: localRecipe.id,
          id: fakeId,
          label: variables.label,
          order:
            localRecipe.ingredientGroups.find(
              (g) => g.id == variables.ingredientGroupId,
            )?.ingredients.length ?? 0,
          value: 1,
          unit: "NONE",
          ingredientGroupId: variables.ingredientGroupId,
        };

      setLocalRecipe(
        recomputeIngredientOrders({
          ...localRecipe,
          ingredientGroups: localRecipe.ingredientGroups.map((g) => {
            if (g.id == variables.ingredientGroupId) {
              return { ...g, ingredients: [...g.ingredients, fakeIngredient] };
            }
            return g;
          }),
        }),
      );

      setInputFocusId("_in_" + fakeId);
      return { fakeId };
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (!onMutateResult?.fakeId || !data) return;
      setResolvedId(onMutateResult.fakeId, data.id);
    },
  });

  const { mutate: updateIngredient } = api.ingredient.update.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) return;

      utils.recipe.get.setData({ id: recipeId }, (prev) => {
        if (!prev) return;
        return {
          ...prev,
          ingredientGroups: prev.ingredientGroups.map((g) => ({
            ...g,
            ingredients: g.ingredients.map((i) =>
              i.id == variables.id ? { ...i, ...variables } : { ...i },
            ),
          })),
        };
      });
    },
  });

  const [newIngredientLabel, setNewIngredientLabel] = useState("");

  const stripIds = (recipe: RecipeIncluded) => ({
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    tags: recipe.tags,
    ingredientGroups: recipe.ingredientGroups
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((g) => ({
        label: g.label,
        order: g.order,
        default: g.default,
        ingredients: g.ingredients
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((i) => ({
            label: i.label,
            value: i.value,
            unit: i.unit,
            order: i.order,
            ingredientGroupId: i.ingredientGroupId,
          })),
      })),
    stepGroups: recipe.stepGroups
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((sg) => ({
        label: sg.label,
        order: sg.order,
        default: sg.default,
        steps: sg.steps
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ instruction: s.instruction, order: s.order })),
      })),
  });

  const recipeIsSame =
    !!serverRecipe &&
    !!localRecipe &&
    JSON.stringify(stripIds(serverRecipe)) ===
      JSON.stringify(stripIds(localRecipe));

  const recomputeIngredientOrders = (
    recipe: RecipeIncluded,
  ): RecipeIncluded => {
    const orderedGroups = [
      ...recipe.ingredientGroups.filter((g) => g.default),
      ...recipe.ingredientGroups
        .filter((g) => !g.default)
        .sort((a, b) => a.order - b.order),
    ];
    const newOrder = new Map<string, number>();
    let counter = 0;
    for (const group of orderedGroups) {
      for (const ing of [...group.ingredients].sort(
        (a, b) => a.order - b.order,
      )) {
        newOrder.set(ing.id, counter++);
      }
    }
    return {
      ...recipe,
      ingredientGroups: recipe.ingredientGroups.map((g) => ({
        ...g,
        ingredients: g.ingredients.map((i) => ({
          ...i,
          order: newOrder.get(i.id) ?? i.order,
        })),
      })),
    };
  };

  // -- Drag and drop --
  const [activeItem, setActiveItem] = useState<{
    type: "section" | "ingredient";
    id: string;
  } | null>(null);
  const [layoutAnimationsEnabled, setLayoutAnimationsEnabled] = useState(true);

  const dragStartRecipe = useRef<RecipeIncluded | null>(null);
  const layeredCollisionDetection: CollisionDetection = (args) => {
    const { active, droppableContainers } = args;

    const itemContainers = droppableContainers.filter(
      (c) => c.data.current?.type === "ingredient",
    );
    const groupContainers = droppableContainers.filter(
      (c) =>
        c.data.current?.type === "section" || c.data.current?.type === "group",
    );

    if (active.data.current?.type === "section") {
      return closestCenter({
        ...args,
        droppableContainers: groupContainers.filter(
          (c) => c.data.current?.type === "section",
        ),
      });
    }

    // Try pointerWithin on items — uses cursor, not active rect
    const itemPointerCollisions = pointerWithin({
      ...args,
      droppableContainers: itemContainers,
    });

    if (getFirstCollision(itemPointerCollisions)) {
      return itemPointerCollisions;
    }

    // Fall back to group containers via pointerWithin
    const groupPointerCollisions = pointerWithin({
      ...args,
      droppableContainers: groupContainers,
    });

    if (getFirstCollision(groupPointerCollisions)) {
      return groupPointerCollisions;
    }

    // Final fallback
    return rectIntersection({
      ...args,
      droppableContainers: groupContainers,
    });
  };
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    dragStartRecipe.current = localRecipe;
    const type = event.active.data.current?.type as "section" | "ingredient";
    setActiveItem({ type, id: String(event.active.id) });
    setLayoutAnimationsEnabled(false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localRecipe) return;
    if (active.data.current?.type !== "ingredient") return;

    const ingredientId = String(active.id);
    const overId = String(over.id);
    const overType = over.data.current?.type as string | undefined;

    const currentGroup = localRecipe.ingredientGroups.find((g) =>
      g.ingredients.some((i) => i.id === ingredientId),
    );
    if (!currentGroup) return;

    let targetGroupId: string | undefined;
    if (overType === "ingredient") {
      targetGroupId = localRecipe.ingredientGroups.find((g) =>
        g.ingredients.some((i) => i.id === overId),
      )?.id;
    } else if (overType === "group" || overType === "section") {
      targetGroupId = overId;
    }

    // Only act on group changes — precise positioning is handled in onDragEnd
    if (!targetGroupId || currentGroup.id === targetGroupId) return;

    const targetGroup = localRecipe.ingredientGroups.find(
      (g) => g.id === targetGroupId,
    );
    if (!targetGroup) return;

    const ingredient = currentGroup.ingredients.find(
      (i) => i.id === ingredientId,
    );
    if (!ingredient) return;

    const newCurrentIngredients = currentGroup.ingredients
      .filter((i) => i.id !== ingredientId)
      .sort((a, b) => a.order - b.order)
      .map((i, idx) => ({ ...i, order: idx }));

    const newTargetIngredients = [
      ...[...targetGroup.ingredients].sort((a, b) => a.order - b.order),
      { ...ingredient, ingredientGroupId: targetGroupId },
    ].map((i, idx) => ({ ...i, order: idx }));

    setLocalRecipe(
      recomputeIngredientOrders({
        ...localRecipe,
        ingredientGroups: localRecipe.ingredientGroups.map((g) => {
          if (g.id === currentGroup.id)
            return { ...g, ingredients: newCurrentIngredients };
          if (g.id === targetGroupId)
            return { ...g, ingredients: newTargetIngredients };
          return g;
        }),
      }),
    );
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const type = event.active.data.current?.type;
    if (type === "section") handleSectionDragEnd(event);
    else if (type === "ingredient") handleIngredientDragEnd(event);
    dragStartRecipe.current = null;
    setActiveItem(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayoutAnimationsEnabled(true);
      });
    });
  };

  const handleDragCancel = () => {
    if (dragStartRecipe.current) setLocalRecipe(dragStartRecipe.current);
    dragStartRecipe.current = null;
    setActiveItem(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayoutAnimationsEnabled(true);
      });
    });
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    if (!localRecipe) return;
    const { active, over } = event;
    console.log("[sectionEnd]", {
      activeId: String(active.id),
      overId: over ? String(over.id) : null,
    });
    if (!over || active.id === over.id) return;

    const sortedNonDefault = localRecipe.ingredientGroups
      .filter((g) => !g.default)
      .sort((a, b) => a.order - b.order);

    const oldIndex = sortedNonDefault.findIndex((g) => g.id === active.id);
    const newIndex = sortedNonDefault.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedNonDefault, oldIndex, newIndex).map(
      (g, idx) => ({
        ...g,
        order: idx,
      }),
    );

    const reorderedById = new Map(reordered.map((g) => [g.id, g]));
    setLocalRecipe(
      recomputeIngredientOrders({
        ...localRecipe,
        ingredientGroups: localRecipe.ingredientGroups.map(
          (g) => reorderedById.get(g.id) ?? g,
        ),
      }),
    );
  };

  const handleIngredientDragEnd = (event: DragEndEvent) => {
    if (!localRecipe) return;
    const { active, over } = event;
    if (!over) return;

    const ingredientId = String(active.id);
    const overId = String(over.id);
    const overType = over.data.current?.type as string | undefined;

    const sourceGroup = localRecipe.ingredientGroups.find((g) =>
      g.ingredients.some((i) => i.id === ingredientId),
    );
    if (!sourceGroup) return;

    let targetGroupId: string | undefined;
    if (overType === "ingredient") {
      const grp = localRecipe.ingredientGroups.find((g) =>
        g.ingredients.some((i) => i.id === overId),
      );
      targetGroupId = grp?.id;
    } else if (overType === "group" || overType === "section") {
      targetGroupId = overId;
    }
    if (!targetGroupId) return;

    const targetGroup = localRecipe.ingredientGroups.find(
      (g) => g.id === targetGroupId,
    );
    if (!targetGroup) return;

    const sourceIngredients = [...sourceGroup.ingredients].sort(
      (a, b) => a.order - b.order,
    );
    const ingredient = sourceIngredients.find((i) => i.id === ingredientId);
    if (!ingredient) return;

    // Same-group reorder
    if (sourceGroup.id === targetGroupId) {
      if (overType !== "ingredient" || ingredientId === overId) return;

      const oldIndex = sourceIngredients.findIndex(
        (i) => i.id === ingredientId,
      );
      const newIndex = sourceIngredients.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sourceIngredients, oldIndex, newIndex).map(
        (i, idx) => ({ ...i, order: idx }),
      );

      setLocalRecipe(
        recomputeIngredientOrders({
          ...localRecipe,
          ingredientGroups: localRecipe.ingredientGroups.map((g) =>
            g.id === sourceGroup.id ? { ...g, ingredients: reordered } : g,
          ),
        }),
      );
      return;
    }

    // Cross-group move
    const newSourceIngredients = sourceIngredients
      .filter((i) => i.id !== ingredientId)
      .map((i, idx) => ({ ...i, order: idx }));

    const targetIngredients = [...targetGroup.ingredients].sort(
      (a, b) => a.order - b.order,
    );

    let insertIndex = targetIngredients.length;
    if (overType === "ingredient") {
      const overIdx = targetIngredients.findIndex((i) => i.id === overId);
      if (overIdx !== -1) insertIndex = overIdx;
    }

    const newTargetIngredients = [
      ...targetIngredients.slice(0, insertIndex),
      { ...ingredient, ingredientGroupId: targetGroupId },
      ...targetIngredients.slice(insertIndex),
    ].map((i, idx) => ({ ...i, order: idx }));

    setLocalRecipe(
      recomputeIngredientOrders({
        ...localRecipe,
        ingredientGroups: localRecipe.ingredientGroups.map((g) => {
          if (g.id === sourceGroup.id)
            return { ...g, ingredients: newSourceIngredients };
          if (g.id === targetGroupId)
            return { ...g, ingredients: newTargetIngredients };
          return g;
        }),
      }),
    );
  };

  const defaultIngredientGroup = localRecipe?.ingredientGroups.find(
    (g) => g.default,
  );

  if (!localRecipe || !defaultIngredientGroup) {
    return <div className="text-text-500 p-16">loading...</div>;
  }

  const sortedNonDefault = localRecipe.ingredientGroups
    .filter((g) => !g.default)
    .sort((a, b) => a.order - b.order);

  const activeSection =
    activeItem?.type === "section"
      ? localRecipe.ingredientGroups.find((g) => g.id === activeItem.id)
      : null;

  const activeIngredient =
    activeItem?.type === "ingredient"
      ? localRecipe.ingredientGroups
          .flatMap((g) => g.ingredients)
          .find((i) => i.id === activeItem.id)
      : null;

  const handleNumberChange = (
    n: string,
    setValue: (num: number | null) => void,
  ) => {
    if (!n) setValue(null);

    const parsed = parseInt(n);

    if (!isNaN(parsed)) {
      setValue(parsed);
    }
  };

  const dropAnimation = {
    duration: 250,
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  };

  return (
    <RecipeEditContext.Provider
      value={{
        localRecipe,
        setLocalRecipe,
        recipeId,
        focusedInputId: inputFocusId,
        setFocusedInputId: setInputFocusId,
        layoutAnimationsEnabled,
      }}
    >
      <Container className="relative flex flex-col gap-8 p-16 pt-0">
        <span className="text-text-500">
          {recipeIsSame && (isSuccess || syncStatus == "idle")
            ? "synced"
            : isPending || ingredientGroupIsPending
              ? "syncing..."
              : "not synced"}
        </span>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              onChange={(e) => {
                if (!localRecipe) return;
                setLocalRecipe({ ...localRecipe, title: e.target.value });
              }}
              placeholder="Name your recipe"
              label="Title"
              type="text"
              value={localRecipe?.title ?? ""}
            />
            <TextArea
              value={localRecipe?.description ?? ""}
              cols={50}
              className="resize-none"
              label="Description"
              placeholder="Talk about your recipe"
              rows={6}
              onChange={(e) => {
                if (!localRecipe) return;
                setLocalRecipe({ ...localRecipe, description: e.target.value });
              }}
            />
          </div>
          <div className="flex gap-4">
            <Input
              label="Prep Time (minutes)"
              placeholder="Time to prep"
              value={localRecipe.prepTimeMinutes ?? ""}
              onChange={(e) =>
                handleNumberChange(e.target.value, (num) => {
                  setLocalRecipe({
                    ...localRecipe,
                    prepTimeMinutes: num,
                  });
                })
              }
            />
            <Input
              label="Cook Time (minutes)"
              placeholder="Time to cook"
              value={localRecipe.cookTimeMinutes ?? ""}
              onChange={(e) =>
                handleNumberChange(e.target.value, (num) => {
                  setLocalRecipe({
                    ...localRecipe,
                    cookTimeMinutes: num,
                  });
                })
              }
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={layeredCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              newIngredient({
                recipeId,
                ingredientGroupId: defaultIngredientGroup.id,
                label: newIngredientLabel,
              });
              setNewIngredientLabel("");
            }}
          >
            <Input
              placeholder="Create a new ingredient"
              value={newIngredientLabel}
              onChange={(e) => setNewIngredientLabel(e.target.value)}
              className="border-accent-600 border-dashed focus:outline-dashed"
            />
          </form>

          {localRecipe.ingredientGroups.flatMap((g) => g.ingredients).length >
            0 && (
            <SortableContext
              items={defaultIngredientGroup.ingredients
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableIngredientList groupId={defaultIngredientGroup.id}>
                {defaultIngredientGroup.ingredients.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {defaultIngredientGroup.ingredients
                        .sort((a, b) => a.order - b.order)
                        .map((i) => (
                          <IngredientEdit key={i.id} ingredient={i} />
                        ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <div className="text-text-500 py-2 text-sm">
                    Drop ingredients here
                  </div>
                )}
              </DroppableIngredientList>
            </SortableContext>
          )}

          {sortedNonDefault.length > 0 && (
            <SortableContext
              items={sortedNonDefault.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-4">
                {sortedNonDefault.map((g) => (
                  <IngredientSection key={g.id} group={g} />
                ))}
              </ul>
            </SortableContext>
          )}

          <DragOverlay dropAnimation={null}>
            {activeSection ? (
              <IngredientSectionDragPreview group={activeSection} />
            ) : activeIngredient ? (
              <IngredientDragPreview ingredient={activeIngredient} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            newIngredientSection({
              recipeId,
              label: newIngredientSectionLabel,
            });
            setNewIngredientSectionLabel("");
          }}
        >
          <Input
            value={newIngredientSectionLabel}
            onChange={(e) => setNewIngredientSectionLabel(e.target.value)}
            className="border-accent-600 w-70 border-dashed focus:outline-dashed"
            placeholder="Create new ingredient section"
          />
        </form>
      </Container>
    </RecipeEditContext.Provider>
  );
};

export default EditRecipe;
