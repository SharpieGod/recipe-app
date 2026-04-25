"use client";

import { api, type RouterOutputs } from "~/trpc/react";
import Popdown from "../generic/Popdown";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { useResolvedId } from "~/hooks/useResolvedId";

type Props = {
  recipe: RouterOutputs["user"]["getUserRecipes"][number];
  canEdit: boolean;
  userId: string;
};

const RecipeItem = ({ recipe: initialRecipe, canEdit, userId }: Props) => {
  const { data: recipe, isLoading } = api.recipe.getPreview.useQuery(
    {
      id: initialRecipe.id, // id wont change
    },
    { initialData: initialRecipe },
  );

  const { data: ratings, isLoading: ratingsLoading } =
    api.recipe.getRating.useQuery(
      {
        id: initialRecipe.id,
      },
      { enabled: recipe?.publishedAt != null },
    );

  const utils = api.useUtils();

  const { mutate: deleteRecipe } = api.recipe.delete.useMutation({
    onMutate(variables, context) {
      const prevRecipes = utils.user.getUserRecipes.getData({ id: userId });

      utils.user.getUserRecipes.setData(
        { id: userId },
        (prevRecipes ?? []).filter(
          (r) => r.id !== variables.id && r.id !== initialRecipe.id,
        ),
      );
    },
  });

  const hasTempPrefix = initialRecipe.id.startsWith("_tempid_");
  const resolvedId = useResolvedId(initialRecipe.id);
  const isTemp = hasTempPrefix && !resolvedId;
  const editableId = resolvedId ?? initialRecipe.id;

  const RecipeComponent = (
    <div
      className={cn(
        "cursor-pointer overflow-hidden rounded-xl border border-black/10 shadow-sm transition-opacity duration-300",
        {
          "cursor-not-allowed border-dotted border-black/50 opacity-30": isTemp,
          "opacity-100": !isTemp,
        },
      )}
    >
      {isLoading || !recipe ? (
        <>Loading</>
      ) : (
        <>
          <div className="hover:bg-background-100 flex flex-col items-start gap-2 p-3 transition-colors">
            <div className="flex w-full flex-row flex-wrap items-center justify-between">
              <h1 className="min-w-fit text-xl">{recipe.title}</h1>
              <div className="text-text-500 flex flex-row items-center justify-end gap-8">
                {!canEdit ? (
                  <span>{recipe.servings ?? "?"} servings</span>
                ) : (
                  <span>{!recipe.publishedAt ? "private" : "public"}</span>
                )}
                {recipe.publishedAt ? (
                  <span
                    aria-busy={ratingsLoading || !ratings}
                    className="transition-opacity duration-300 not-aria-busy:opacity-100 aria-busy:opacity-50"
                  >
                    {ratingsLoading || !ratings
                      ? "?/5 (?)"
                      : `${ratings._avg.value ?? "?"}/5 (${ratings._count})`}
                  </span>
                ) : null}
              </div>
            </div>
            {recipe.description.length === 0 ? (
              <span className="text-text-500">Description is empty</span>
            ) : (
              <span className="text-text-500">{recipe.description}</span>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <pre className="text-xs">{JSON.stringify(recipe, null, 2)}</pre>
      {canEdit ? (
        <Popdown
          trigger={RecipeComponent}
          className="w-80"
          openStyle="top-22"
          enabled={!isTemp}
        >
          <Link href={`/recipe/${editableId}/edit`}>Edit</Link>
          <Link href={`/recipe/${editableId}/preview`}>Preview</Link>
          <button onClick={() => deleteRecipe({ id: editableId })}>
            Delete
          </button>
        </Popdown>
      ) : (
        RecipeComponent
      )}
    </div>
  );
};

export default RecipeItem;
