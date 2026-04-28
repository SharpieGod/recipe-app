"use client";

import { useEffect, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import Popdown from "../generic/Popdown";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { useResolvedId } from "~/hooks/useResolvedId";
import Button from "../generic/Button";
import Image from "next/image";
import { formatMinutesToTime } from "./RecipeView";
import { Clock1, Clock12, Clock4 } from "lucide-react";

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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!isDeleteOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDeleteOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isDeleteOpen]);

  const hasTempPrefix = initialRecipe.id.startsWith("_tempid_");
  const resolvedId = useResolvedId(initialRecipe.id);
  const isTemp = hasTempPrefix && !resolvedId;
  const editableId = resolvedId ?? initialRecipe.id;

  const RecipeComponent = (
    <div
      className={cn(
        "cursor-pointer overflow-hidden rounded-xl border border-black/10 transition-opacity duration-300",
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
          <div className="hover:bg-background-100 flex flex-col items-start transition-colors">
            <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden">
              <Image
                src={recipe.imageUrl ?? "/placeholder.webp"}
                className="aspect-7/3 w-full object-cover object-center"
                alt={recipe.title + " image"}
                width={600}
                height={600}
                sizes="(max-width: 768px) 100vw, 540px"
              />
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 p-3">
              <div className="flex w-full flex-row flex-wrap items-center justify-between">
                <h1 className="min-w-fit text-xl">{recipe.title}</h1>
                <div className="text-text-500 flex flex-row items-center justify-end gap-8">
                  {!canEdit ? (
                    <div className="flex items-center gap-1">
                      <Clock4 size={16} />
                      <span>
                        {formatMinutesToTime(
                          (recipe.cookTimeMinutes ?? 0) +
                            (recipe.prepTimeMinutes ?? 0),
                        )}
                      </span>
                    </div>
                  ) : !recipe.publishedAt ? (
                    <span>private</span>
                  ) : null}
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
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      {/* <pre className="text-xs">{JSON.stringify(recipe, null, 2)}</pre> */}
      {canEdit ? (
        <Popdown
          trigger={RecipeComponent}
          className="w-80"
          openStyle="top-full"
          enabled={!isTemp}
        >
          {recipe?.publishedAt === null ? (
            <>
              <Link href={`/recipe/${editableId}/edit`}>Edit</Link>
              <Link href={`/recipe/${editableId}/preview`}>Preview</Link>
            </>
          ) : (
            <>
              <Link href={`/recipe/${editableId}`}>View</Link>
            </>
          )}
          <button onClick={() => setIsDeleteOpen(true)}>Delete</button>
        </Popdown>
      ) : (
        <Link href={`/recipe/${recipe?.id}`}>{RecipeComponent}</Link>
      )}
      <div
        onClick={() => setIsDeleteOpen(false)}
        className={cn(
          "fixed inset-0 z-100 bg-black/50 backdrop-blur-xs",
          "transition-opacity duration-200",
          isDeleteOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div
          className="bg-background-100 z-101 mx-auto mt-40 flex w-100 flex-col gap-2 rounded-xl border border-black/10 p-4 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <h1 className="text-xl">Delete &quot;{recipe?.title}&quot;?</h1>
          <span className="text-text-500">This can&apos;t be undone</span>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                deleteRecipe({ id: editableId });
                setIsDeleteOpen(false);
              }}
            >
              Delete
            </Button>
            <Button variant="empty" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeItem;
