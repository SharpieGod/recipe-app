"use client";
import { api, type RouterOutputs } from "~/trpc/react";
import RecipeItem from "./RecipeItem";
import { useSession } from "next-auth/react";

type Props = {
  recipes: RouterOutputs["user"]["getUserRecipes"];
  canEdit: boolean;
  userId: string;
};

const RecipeList = ({ recipes: initialRecipes, canEdit, userId }: Props) => {
  const { data: recipes } = api.user.getUserRecipes.useQuery(
    { id: userId },
    { initialData: initialRecipes },
  );

  return (
    <ul>
      {recipes.map((r) => (
        <li className="flex flex-col gap-4" key={r.id}>
          <RecipeItem recipe={r} canEdit={canEdit} userId={userId} />
        </li>
      ))}
    </ul>
  );
};

export default RecipeList;
