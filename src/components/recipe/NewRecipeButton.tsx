"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../generic/Button";
import FullScreenPopup from "../generic/FullScreenPopup";
import Input from "../generic/Input";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useSetResolvedId } from "~/hooks/useResolvedId";

const NreRecipeButton = () => {
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const setResolvedId = useSetResolvedId();

  const { mutate: createRecipe } = api.recipe.new.useMutation({
    onMutate(variables, context) {
      const tempId = "_tempid_" + crypto.randomUUID();

      const tempRecipe: RouterOutputs["user"]["getUserRecipes"][number] = {
        id: tempId,
        title: variables.title,
        description: "",
        cookTimeMinutes: null,
        createdAt: new Date(),
        prepTimeMinutes: null,
        publishedAt: null,
        servings: null,
        tags: [],
        updatedAt: new Date(),
        userId: session!.user!.id,
      };

      const prevRecipes = utils.user.getUserRecipes.getData({
        id: session!.user!.id,
      });

      utils.user.getUserRecipes.setData({ id: session!.user!.id }, [
        tempRecipe,
        ...(prevRecipes ?? []),
      ]);

      utils.recipe.getPreview.setData({ id: tempId }, tempRecipe);

      return { tempId };
    },

    onSuccess(realRecipe, variables, onMutateResult, context) {
      setResolvedId(onMutateResult.tempId, realRecipe.id);
    },
  });

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      <div onClick={() => setIsOpen(!isOpen)} className="h-fit w-fit">
        <Button popoverTarget="new-recipe-popover">New Recipe</Button>
      </div>

      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-100 bg-black/50 backdrop-blur-xs",
          "transition-opacity duration-200",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <form
          className={cn(
            "bg-background-100 z-101 mx-auto mt-40 w-100 rounded-xl border border-black/10 p-4 shadow-sm",
            "flex flex-col gap-2",
          )}
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            if (!newRecipeTitle.trim()) return;
            createRecipe({ title: newRecipeTitle });
            setNewRecipeTitle("");
            setIsOpen(false);
          }}
        >
          <Input
            value={newRecipeTitle}
            onChange={(e) => setNewRecipeTitle(e.target.value)}
            placeholder="Title your recipe!"
            label="Recipe Title"
            className="w-full"
            ref={inputRef}
          />
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
            <Button
              type="button"
              variant="empty"
              onClick={() => {
                setNewRecipeTitle("");
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NreRecipeButton;
