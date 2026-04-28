import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";
import RecipeList from "~/components/recipe/RecipeList";
import UserImage from "~/components/user/UserImage";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

const UserRecipesPage = async ({ params }: Props) => {
  const session = await auth();
  const { id } = await params;

  if (session && session.user.id == id) {
    return redirect("/my-recipes");
  }

  const user = await db.user.findFirst({
    where: {
      id,
    },
  });
  const userRecipes = await api.user.getUserRecipes({ id });

  if (!user || userRecipes.length == 0) {
    return redirect("/");
  }

  return (
    <>
      <Navbar />
      <Container>
        <span className="text-text-500">Recipes by</span>
        <div className="mb-8 flex items-center gap-2">
          <UserImage user={user} />
          <h1 className="text-xl">{user.name}</h1>
        </div>
        <SessionProvider>
          <div className="flex flex-col gap-4">
            <RecipeList recipes={userRecipes} userId={id} canEdit={false} />
          </div>
        </SessionProvider>
      </Container>
    </>
  );
};

export default UserRecipesPage;
