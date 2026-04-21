import { redirect } from "next/navigation";
import Container from "~/components/Container";
import Navbar from "~/components/Navbar";
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
        <h1 className="text-4xl">Your Recipes</h1>

        <RecipeList recipes={userRecipes} canEdit={true} />
      </Container>
    </>
  );
};

export default MyRecipesPage;
