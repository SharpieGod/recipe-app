import { redirect } from "next/navigation";
import Navbar from "~/components/generic/Navbar";
import EditRecipe from "~/components/recipe/EditRecipe";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

const EditRecipePage = async ({ params }: Props) => {
  const { id } = await params;
  const session = await auth();

  if (!session) return redirect("/");
  await api.recipe.get.prefetch({ id });

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
