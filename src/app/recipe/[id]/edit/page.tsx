import Navbar from "~/components/generic/Navbar";
import EditRecipe from "~/components/recipe/EditRecipe";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

const EditRecipePage = async ({ params }: Props) => {
  const { id } = await params;

  await api.recipe.getRecipe.prefetch({ id });

  return (
    <>
      <Navbar />
      <HydrateClient>
        <EditRecipe recipeId={id} />
      </HydrateClient>
    </>
  );
};

export default EditRecipePage;
