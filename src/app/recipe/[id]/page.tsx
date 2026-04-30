import { SessionProvider } from "next-auth/react";
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

  void api.recipe.get.prefetch({ id });

  return (
    <>
      <Navbar />
      <HydrateClient>
        <SessionProvider>
          <RecipeView recipeId={id} />
        </SessionProvider>
      </HydrateClient>
    </>
  );
};

export default PreviewRecipePage;
