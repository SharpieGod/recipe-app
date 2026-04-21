"use client";

import type { RouterOutputs } from "~/trpc/react";
import RecipeItem from "./RecipeItem";

type Props = {
  recipes: RouterOutputs["user"]["getUserRecipes"];
  canEdit: boolean;
};

const RecipeList = ({ recipes, canEdit }: Props) => {
  return (
    <ul>
      {recipes.map((r) => (
        <li className="flex flex-col gap-4" key={r.id}>
          <RecipeItem recipe={r} canEdit={canEdit} />
        </li>
      ))}
    </ul>
  );
};

export default RecipeList;
