"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import Button from "../generic/Button";
import { useDebounce } from "~/hooks/useDebounce";
import TextArea from "../generic/Textarea";
import type { Ingredient, IngredientGroup } from "generated/prisma";
import { useResolvedId, useSetResolvedId } from "~/hooks/useResolvedId";

type Props = {
  recipeId: string;
};

const EditRecipe = ({ recipeId }: Props) => {
  const utils = api.useUtils();
  const setResolvedId = useSetResolvedId();
  const getResolvedId = useResolvedId;

  const { data: serverRecipe, isLoading: isSyncing } = api.recipe.get.useQuery({
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
      utils.recipe.getPreview.setData({ id: recipeId }, { ...localRecipe });
      return prev_recipe;
    },

    onError(error, variables, prev_recipe, context) {
      utils.recipe.get.setData({ id: recipeId }, prev_recipe);
    },

    onSuccess(data, variables, onMutateResult, context) {
      // I never want the server to override client! optimism!
    },
  });

  const debouncedValues = useDebounce(localRecipe, 1000);

  useEffect(() => {
    if (!debouncedValues || recipeIsSame) return;

    updateRecipe(debouncedValues);
  }, [debouncedValues]);

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

      return { fakeId };
    },
    onSuccess(data, variables, onMutateResult, context) {
      if (!onMutateResult?.fakeId || !data) {
        return;
      }

      setResolvedId(onMutateResult.fakeId, data.id);
    },
  });

  const { mutate: updateIngredientSection } =
    api.ingredientGroup.update.useMutation({});

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

  const recipeIsSame = (serverRecipe &&
    localRecipe &&
    serverRecipe.title === localRecipe.title &&
    serverRecipe.description === localRecipe.description &&
    serverRecipe.servings === localRecipe.servings &&
    serverRecipe.prepTimeMinutes === localRecipe.prepTimeMinutes &&
    serverRecipe.cookTimeMinutes === localRecipe.cookTimeMinutes &&
    JSON.stringify(serverRecipe.tags) === JSON.stringify(localRecipe.tags) &&
    JSON.stringify(serverRecipe.ingredientGroups) ===
      JSON.stringify(localRecipe.ingredientGroups) &&
    JSON.stringify(serverRecipe.stepGroups) ===
      JSON.stringify(localRecipe.stepGroups)) as boolean;

  const defaultIngredientGroup = localRecipe?.ingredientGroups.find(
    (g) => g.default,
  );
  if (!localRecipe || !defaultIngredientGroup) {
    return <div className="text-text-500 p-16">loading...</div>;
  }

  return (
    <div className="relative flex flex-col gap-4 p-16">
      <pre className="absolute top-0 right-0 max-w-100 text-[10px]">
        {JSON.stringify(localRecipe, null, 2)}
      </pre>
      <span className="text-text-500">
        {recipeIsSame && (isSuccess || syncStatus == "idle")
          ? "synced"
          : isPending
            ? "sycing..."
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
                        <IngredientEdit ingredient={i} />
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
  );
};

export default EditRecipe;

const IngredientEdit = ({ ingredient }: { ingredient: Ingredient }) => {
  return <li>{ingredient.label}</li>;
};
