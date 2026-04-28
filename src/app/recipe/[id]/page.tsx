import { redirect } from "next/navigation";
import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";
import RecipeView from "~/components/recipe/RecipeView";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

const PreviewRecipePage = async ({ params }: Props) => {
  const { id } = await params;

  const session = await auth();

  if (!session) {
    return redirect("/");
  }

  void api.recipe.get.prefetch({ id });

  return (
    <>
      <Navbar />
      <HydrateClient>
        <RecipeView recipeId={id} />
      </HydrateClient>
    </>
  );
};

export default PreviewRecipePage;
