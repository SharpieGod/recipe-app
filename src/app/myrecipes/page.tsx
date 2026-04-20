import { redirect } from "next/navigation";
import Navbar from "~/components/Navbar";
import { auth } from "~/server/auth";

const MyRecipesPage = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return redirect("/");
  }

  return (
    <>
      <Navbar />
    </>
  );
};

export default MyRecipesPage;
