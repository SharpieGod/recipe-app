"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import Button from "../generic/Button";
import { useDebounce } from "~/hooks/useDebounce";
import TextArea from "../generic/Textarea";
import type { IngredientGroup } from "generated/prisma";

type Props = {
  recipeId: string;
};

const EditRecipe = ({ recipeId }: Props) => {
  const utils = api.useUtils();

  const { data: serverRecipe, isLoading: isSyncing } =
    api.recipe.getRecipe.useQuery({
      id: recipeId,
    });

  const [localRecipe, setLocalRecipe] = useState<RecipeIncluded | null>(null);

  useEffect(() => {
    if (localRecipe == null && serverRecipe) {
      setLocalRecipe(serverRecipe);
    }
  }, [serverRecipe]);

  const { mutate: updateRecipe, status: syncStatus } =
    api.recipe.updateRecipe.useMutation({
      onMutate: (input) => {
        if (!localRecipe) return;

        const prev_recipe = serverRecipe;
        utils.recipe.getRecipe.setData({ id: recipeId }, { ...localRecipe });
        return prev_recipe;
      },
      onError(error, variables, prev_recipe, context) {
        utils.recipe.getRecipe.setData({ id: recipeId }, prev_recipe);
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

  const { mutate: newIngredientSection } =
    api.recipe.newIngredientSection.useMutation({
      onMutate(variables, context) {
        if (!localRecipe) {
          return;
        }
        const fakeId = "__fake__id__" + new Date();
        const fakeIngredientGroup: RecipeIncluded["ingredientGroups"][number] =
          {
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
        if (!localRecipe || !data) return;

        setLocalRecipe({
          ...localRecipe,
          ingredientGroups: localRecipe.ingredientGroups.map((g) => {
            if (g.id === onMutateResult?.fakeId) {
              return data;
            }
            return g;
          }),
        });
        onMutateResult?.fakeId;
      },
    });

  const [newSectionLabel, setNewSectionLabel] = useState("");

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

  if (!localRecipe) {
    return <>loading</>;
  }

  return (
    <div className="relative flex flex-col gap-4 p-16">
      <pre className="absolute top-0 right-0">
        {JSON.stringify(localRecipe, null, 2)}
      </pre>
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
          newIngredientSection({ id: localRecipe.id, label: newSectionLabel });
          setNewSectionLabel("");
        }}
      >
        <Input
          value={newSectionLabel}
          onChange={(e) => setNewSectionLabel(e.target.value)}
          label="New Ingredients Section"
          className="border-dashed focus:outline-dashed"
          placeholder="Label your section"
        />
      </form>
      <ul className="flex flex-col gap-4">
        {localRecipe?.ingredientGroups
          .sort((a, b) => a.order - b.order)
          .map((g) => (
            <li key={g.id}>{g.label}</li>
          ))}
      </ul>
    </div>
  );
  1;
};

export default EditRecipe;
