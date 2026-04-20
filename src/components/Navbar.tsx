import Link from "next/link";
import { auth } from "~/server/auth";
import SignInButton from "./SignInButton";
import SignOutButton from "./SingOutButton";
import Button from "./Button";

const Navbar = async () => {
  const session = await auth();

  return (
    <nav className="bg-background-50 sticky top-0 left-0 z-100 flex min-h-15 w-full items-center justify-between border-b border-black/10 px-25 text-lg lg:px-45">
      <Link href={"/"} className="text-xl font-semibold tracking-normal">
        Recipe Notebook
      </Link>
      <div className="flex items-center gap-16 *:cursor-pointer">
        <Link href={"/about"}>About</Link>

        {session?.user ? (
          <>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href={"/sign-in"}>Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
