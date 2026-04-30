import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";
import RecipeView from "~/components/recipe/RecipeView";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
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

  const recipe = await db.recipe.findFirst({
    where: {
      id,
    },
    select: {
      publishedAt: true,
    },
  });

  if (!recipe) {
    return redirect("/");
  }

  if (recipe.publishedAt) {
    return redirect("/recipe/" + id);
  }

  void api.recipe.get.prefetch({ id });

  return (
    <>
      <Navbar />
      <HydrateClient>
        <SessionProvider>
          <RecipeView recipeId={id} preview />
        </SessionProvider>
      </HydrateClient>
    </>
  );
};

export default PreviewRecipePage;
