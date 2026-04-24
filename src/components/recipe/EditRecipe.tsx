"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { unitLabel, type RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import Button from "../generic/Button";
import { useDebounce } from "~/hooks/useDebounce";
import TextArea from "../generic/Textarea";
import { Unit, type Ingredient } from "generated/prisma";
import {
  useGetResolvedId,
  useResolvedId,
  useSetResolvedId,
} from "~/hooks/useResolvedId";
import SelectPopdown from "../generic/SelectPopdown";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type RecipeEditContextType = {
  localRecipe: RecipeIncluded;
  setLocalRecipe: React.Dispatch<React.SetStateAction<RecipeIncluded | null>>;
  recipeId: string;
  focusedInputId: string | null;
  setFocusedInputId: React.Dispatch<React.SetStateAction<string | null>>;
};

const RecipeEditContext = createContext<RecipeEditContextType | null>(null);

const useRecipeEdit = () => {
  const ctx = useContext(RecipeEditContext);
  if (!ctx) throw new Error("useRecipeEdit must be used inside EditRecipe");
  return ctx;
};

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
        !serverGroup || // Was created
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

  const { data: serverRecipe } = api.recipe.get.useQuery({
    id: recipeId,
  });

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

    onSuccess(data, variables, onMutateResult, context) {
      // I never want the server to override client! optimism!
    },
  });

  const debouncedRecipeValues = useDebounce(localRecipe, 800);

  useEffect(() => {
    if (!debouncedRecipeValues || recipeIsSame) return;

    updateRecipeFull();
  }, [debouncedRecipeValues]);

  // -- Ingredient Groups --

  const { mutate: newIngredientSection } = api.ingredientGroup.new.useMutation({
    onMutate(variables, context) {
      if (!localRecipe) {
        return;
      }
      const fakeId = "_tempid_" + crypto.randomUUID();

      const fakeIngredientGroup: RecipeIncluded["ingredientGroups"][number] = {
        recipeId: localRecipe.id,
        default: false,
        id: fakeId,
        label: variables.label,
        order: 0,
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
      if (!onMutateResult?.fakeId || !data) {
        return;
      }

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
              ? {
                  ...g,
                  label: variables.label,
                  order: variables.order,
                }
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
      if (!localRecipe) {
        return;
      }
      const fakeId = "_tempid_" + crypto.randomUUID();

      const fakeIngredient: RecipeIncluded["ingredientGroups"][number]["ingredients"][number] =
        {
          recipeId: localRecipe.id,
          id: fakeId,
          label: variables.label,
          order: 0,
          value: 1,
          unit: "NONE",
          ingredientGroupId: variables.ingredientGroupId,
        };

      setLocalRecipe({
        ...localRecipe,
        ingredientGroups: localRecipe.ingredientGroups.map((g) => {
          if (g.id == variables.ingredientGroupId) {
            return { ...g, ingredients: [...g.ingredients, fakeIngredient] };
          }
          return g;
        }),
      });

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
          ingredientGroups: prev.ingredientGroups.map((g) => {
            return {
              ...g,
              ingredients: g.ingredients.map((i) =>
                i.id == variables.id ? { ...i, ...variables } : { ...i },
              ),
            };
          }),
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
          .map((s) => ({
            instruction: s.instruction,
            order: s.order,
          })),
      })),
  });

  const recipeIsSame =
    !!serverRecipe &&
    !!localRecipe &&
    JSON.stringify(stripIds(serverRecipe)) ===
      JSON.stringify(stripIds(localRecipe));

  if (!!serverRecipe && !!localRecipe) {
    console.log(
      JSON.stringify(stripIds(serverRecipe)) ===
        JSON.stringify(stripIds(localRecipe)),
      "\n SERVER: \n",
      JSON.stringify(stripIds(serverRecipe)),
      "\n LOCAL: \n",
      JSON.stringify(stripIds(localRecipe)),
    );
  }

  const defaultIngredientGroup = localRecipe?.ingredientGroups.find(
    (g) => g.default,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 1 }, // small drag before activating, so clicks still work
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!localRecipe) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sortedNonDefault = localRecipe.ingredientGroups
      .filter((g) => !g.default)
      .sort((a, b) => a.order - b.order);

    const oldIndex = sortedNonDefault.findIndex((g) => g.id === active.id);
    const newIndex = sortedNonDefault.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedNonDefault, oldIndex, newIndex).map(
      (g, idx) => ({ ...g, order: idx }),
    );

    const reorderedById = new Map(reordered.map((g) => [g.id, g]));
    setLocalRecipe({
      ...localRecipe,
      ingredientGroups: localRecipe.ingredientGroups.map(
        (g) => reorderedById.get(g.id) ?? g,
      ),
    });
  };

  if (!localRecipe || !defaultIngredientGroup) {
    return <div className="text-text-500 p-16">loading...</div>;
  }

  return (
    <RecipeEditContext.Provider
      value={{
        localRecipe,
        setLocalRecipe,
        recipeId,
        focusedInputId: inputFocusId,
        setFocusedInputId: setInputFocusId,
      }}
    >
      <div className="relative flex flex-col gap-4 p-16">
        <pre className="absolute top-0 right-0 max-w-100 text-[10px]">
          {JSON.stringify(localRecipe, null, 2)}
        </pre>
        <span className="text-text-500">
          {recipeIsSame && (isSuccess || syncStatus == "idle")
            ? "synced"
            : isPending || ingredientGroupIsPending
              ? "syncing..."
              : "not synced"}
        </span>
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

        {defaultIngredientGroup.ingredients.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {defaultIngredientGroup.ingredients
              .sort((a, b) => a.order - b.order)
              .map((i) => (
                <IngredientEdit key={i.id} ingredient={i} />
              ))}
          </ul>
        ) : null}

        {(() => {
          const sortedNonDefault = localRecipe.ingredientGroups
            .filter((g) => !g.default)
            .sort((a, b) => a.order - b.order);

          if (sortedNonDefault.length === 0) return null;

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedNonDefault.map((g) => g.id)}
                strategy={rectSortingStrategy}
              >
                <ul className="grid grid-cols-2 items-start justify-start gap-4">
                  {sortedNonDefault.map((g) => (
                    <IngredientSection key={g.id} group={g} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          );
        })()}
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
      </div>
    </RecipeEditContext.Provider>
  );
};

export default EditRecipe;

const IngredientSection = ({
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
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-background-50 flex flex-col gap-4 rounded-lg border border-black/10 p-4"
    >
      <div className="flex items-center gap-4">
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

      {group.ingredients.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {group.ingredients
            .sort((a, b) => a.order - b.order)
            .map((i) => (
              <IngredientEdit key={i.id} ingredient={i} />
            ))}
        </ul>
      ) : null}
    </li>
  );
};

const IngredientEdit = ({ ingredient }: { ingredient: Ingredient }) => {
  const { localRecipe, setLocalRecipe, focusedInputId, setFocusedInputId } =
    useRecipeEdit();
  const [valueStr, setValueStr] = React.useState(String(ingredient.value));

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
    <li className="bg-background-100 flex w-120 items-center gap-2 rounded-lg p-2">
      <GripVertical className="text-background-300 size-5 shrink-0" />
      <Input
        className="w-14"
        value={valueStr}
        onChange={(e) => handleValueChange(e.target.value)}
      />
      <SelectPopdown
        className="w-full flex-1"
        entries={Object.values(Unit)
          .filter((u) => u != "NONE")
          .map((s) => {
            return { label: unitLabel(s), key: s };
          })}
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
        className="flex-1"
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
