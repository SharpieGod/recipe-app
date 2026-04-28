import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

type Props = {
  params: Promise<{ id: string }>;
};

const UserRecipesPage = async ({ params }: Props) => {
  const session = await auth();
  const { id } = await params;

  if (session && session.user.id == id) {
    return redirect("/my-recipes");
  }

  return <div></div>;
};

export default UserRecipesPage;
