"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

type RecipeEditContextType = {
  localRecipe: RecipeIncluded;
  setLocalRecipe: React.Dispatch<React.SetStateAction<RecipeIncluded | null>>;
  recipeId: string;
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

    values.ingredientGroups.forEach((g) => {
      const realId = getResolvedId(g.id);
      console.log(realId);
      if (!realId) return;

      const serverGroup = serverRecipe.ingredientGroups.find(
        (gr) => gr.id == realId,
      );
      if (!serverGroup) return;

      const hasChanged =
        serverGroup.label !== g.label || serverGroup.order !== g.order;

      if (hasChanged) {
        updateIngredientSection({
          id: realId,
          label: g.label,
          order: g.order,
        });
      }
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
      if (!localRecipe) return;

      const prev_recipe = serverRecipe;
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

      setInputFocusId(fakeId);

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
  } = api.ingredientGroup.update.useMutation({});

  const [newIngredientSectionLabel, setNewIngredientSectionLabel] =
    useState("");

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

      return { fakeId };
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (!onMutateResult?.fakeId || !data) return;

      setResolvedId(onMutateResult.fakeId, data.id);
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

  const defaultIngredientGroup = localRecipe?.ingredientGroups.find(
    (g) => g.default,
  );
  if (!localRecipe || !defaultIngredientGroup) {
    return <div className="text-text-500 p-16">loading...</div>;
  }

  return (
    <RecipeEditContext.Provider
      value={{ localRecipe, setLocalRecipe, recipeId }}
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

        {localRecipe.ingredientGroups.filter((g) => !g.default).length > 0 ? (
          <ul className="grid grid-cols-2 items-start justify-start gap-4">
            {localRecipe.ingredientGroups
              .filter((g) => !g.default)
              .sort((a, b) => a.order - b.order)
              .map((g) => (
                <li
                  key={g.id}
                  className="flex flex-col gap-4 rounded-lg border border-black/10 p-4"
                >
                  <Input
                    value={g.label}
                    label="Section Label"
                    ref={(el: HTMLInputElement | null) => {
                      if (el && inputFocusId === g.id) {
                        el.focus();

                        setInputFocusId(null);
                      }
                    }}
                    onChange={(e) => {
                      setLocalRecipe({
                        ...localRecipe,
                        ingredientGroups: localRecipe.ingredientGroups.map(
                          (gr) => {
                            if (gr.id == g.id) {
                              return { ...gr, label: e.target.value };
                            }

                            return gr;
                          },
                        ),
                      });
                    }}
                  />

                  {g.ingredients.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {g.ingredients
                        .sort((a, b) => a.order - b.order)
                        .map((i) => (
                          <IngredientEdit key={i.id} ingredient={i} />
                        ))}
                    </ul>
                  ) : null}
                </li>
              ))}
          </ul>
        ) : null}

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

const IngredientEdit = ({ ingredient }: { ingredient: Ingredient }) => {
  const { localRecipe, setLocalRecipe } = useRecipeEdit();
  return (
    <li className="bg-background-100 grid w-fit grid-cols-[1fr_auto_auto] gap-2 rounded-lg p-2">
      <Input
        value={ingredient.label}
        placeholder="Ingredient label"
        className=""
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
      <SelectPopdown
        entries={Object.values(Unit)
          .filter((u) => u != "NONE")
          .map((s) => {
            return { label: unitLabel(s), key: s };
          })}
        onSelected={(key) => {}}
        selectedEntryKey="NONE"
        emptySelectText="Pick a unit"
      />
    </li>
  );
};
