import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";
import NewRecipeButton from "~/components/recipe/NewRecipeButton";
import RecipeList from "~/components/recipe/RecipeList";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

const MyRecipesPage = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return redirect("/");
  }

  const userRecipes = await api.user.getUserRecipes({ id: session.user.id });

  return (
    <>
      <Navbar />
      <Container>
        <h1 className="mb-8 text-4xl">Your Recipes</h1>
        <SessionProvider>
          <div className="flex flex-col gap-4">
            <NewRecipeButton />
            <RecipeList
              recipes={userRecipes}
              userId={session.user.id}
              canEdit={true}
            />
          </div>
        </SessionProvider>
      </Container>
    </>
  );
};

export default MyRecipesPage;
