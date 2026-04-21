"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { RecipeIncluded } from "~/types";
import Input from "../generic/Input";
import Button from "../generic/Button";

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

        utils.recipe.getRecipe.setData({ id: recipeId }, { ...localRecipe });
      },
    });

  const inputsDisabled =
    localRecipe === serverRecipe || syncStatus != "success";

  return (
    <>
      <pre>{JSON.stringify(localRecipe, null, 2)}</pre>
      <Input
        disabled={inputsDisabled}
        onChange={(e) => {
          if (!localRecipe) return;
          setLocalRecipe({ ...localRecipe, title: e.target.value });
        }}
        placeholder={serverRecipe?.title ?? ""}
        label="Title"
        type="text"
        value={localRecipe?.title ?? ""}
      />
      <Button
        onClick={() => {
          if (!localRecipe) return;

          updateRecipe({
            id: recipeId,
            title: localRecipe.title,
            description: localRecipe.description,
          });
        }}
        className="px-4"
        disabled={inputsDisabled}
      >
        Save
      </Button>
    </>
  );
};

export default EditRecipe;
