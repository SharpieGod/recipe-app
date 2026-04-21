"use client";

import { api, type RouterOutputs } from "~/trpc/react";
import Popdown from "../Popdown";
import Link from "next/link";

type Props = {
  recipe: RouterOutputs["user"]["getUserRecipes"][number];

  canEdit: boolean;
};

const RecipeItem = ({ recipe: initialRecipe, canEdit }: Props) => {
  const { data: recipe, isLoading } = api.recipe.getRecipePreview.useQuery(
    {
      id: initialRecipe.id, // id wont change
    },
    { initialData: initialRecipe },
  );

  const { data: ratings, isLoading: ratingsLoading } =
    api.recipe.getRecipeRating.useQuery({
      id: initialRecipe.id,
    });

  const RecipeComponent = (
    <div className="cursor-pointer overflow-hidden rounded-xl border border-black/10 shadow-sm">
      {isLoading || !recipe ? (
        <>Loading</>
      ) : (
        <>
          <div className="hover:bg-background-100 flex flex-col items-start gap-2 p-3 transition-colors">
            <div className="flex w-full flex-row flex-wrap items-center justify-between">
              <h1 className="min-w-fit text-xl">{recipe.title}</h1>

              <div className="text-text-500 flex flex-row items-center justify-end gap-8">
                {!canEdit ? (
                  <>
                    <span className="">{recipe.servings ?? "?"} servings</span>
                  </>
                ) : (
                  <>
                    <span className="">
                      {!recipe.publishedAt ? "private" : "public"}
                    </span>
                  </>
                )}
                {recipe.publishedAt ? (
                  ratingsLoading || !ratings ? (
                    <span className="animate-skeleton">?/5 (?)</span>
                  ) : (
                    <span>
                      {ratings._avg.value ?? "?"}/5 ({ratings._count})
                    </span>
                  )
                ) : null}
              </div>
            </div>

            {recipe.description.length == 0 ? (
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
      <pre>{JSON.stringify(recipe, null, 2)}</pre>
      {canEdit ? (
        <>
          <Popdown
            trigger={RecipeComponent}
            className="w-80"
            openStyle="top-22"
          >
            <Link href={`/recipe/${initialRecipe.id}/edit`}>Edit</Link>
            <Link href={`/recipe/${initialRecipe.id}/preview`}>Preview</Link>
            <div>Delete</div>
          </Popdown>
        </>
      ) : (
        RecipeComponent
      )}
    </div>
  );
};

export default RecipeItem;
