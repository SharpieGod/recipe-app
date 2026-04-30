import Link from "next/link";
import { auth } from "~/server/auth";
import Navbar from "~/components/generic/Navbar";
import Button from "~/components/generic/Button";
import Container from "~/components/generic/Container";

const HomePage = async () => {
  const session = await auth();

  return (
    <>
      <Navbar />

      <Container className="flex flex-col gap-4">
        <div className="flex h-[calc(100vh-20.75rem)] flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <h1 className="font-nothing text-8xl font-medium">
              Recipe Notebook
            </h1>
            <p className="text-text-500 max-w-sm text-lg">
              Write, organize, and share your recipes, all in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/search">
              <Button>Browse Recipes</Button>
            </Link>
            {session ? (
              <Link href="/my-recipes">
                <Button variant="empty">My Recipes</Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button variant="empty">Get Started</Button>
              </Link>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default HomePage;
