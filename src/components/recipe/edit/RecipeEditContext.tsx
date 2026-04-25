import { createContext, useContext } from "react";
import type React from "react";
import type { RecipeIncluded } from "~/types";

export type RecipeEditContextType = {
  localRecipe: RecipeIncluded;
  setLocalRecipe: React.Dispatch<React.SetStateAction<RecipeIncluded | null>>;
  recipeId: string;
  focusedInputId: string | null;
  setFocusedInputId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const RecipeEditContext = createContext<RecipeEditContextType | null>(null);

export const useRecipeEdit = () => {
  const ctx = useContext(RecipeEditContext);
  if (!ctx) throw new Error("useRecipeEdit must be used inside EditRecipe");
  return ctx;
};
