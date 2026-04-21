"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import Button from "../generic/Button";
import { useDebounce } from "~/hooks/useDebounce";
import TextArea from "../generic/Textarea";

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
    if (!debouncedValues) return;

    updateRecipe(debouncedValues);
  }, [debouncedValues]);

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

  return (
    <>
      <pre>{JSON.stringify(localRecipe, null, 2)}</pre>
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
        rows={10}
        onChange={(e) => {
          if (!localRecipe) return;
          setLocalRecipe({ ...localRecipe, description: e.target.value });
        }}
      />
    </>
  );
  1;
};

export default EditRecipe;
