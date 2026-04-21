import Link from "next/link";
import { auth } from "~/server/auth";
import SignInButton from "../SignInButton";
import SignOutButton from "../SingOutButton";
import Button from "./Button";
import AccountButton from "../AccountButton";
const Navbar = async () => {
  const session = await auth();

  return (
    <nav className="bg-background-50 sticky top-0 left-0 z-100 flex min-h-15 w-full items-center justify-between border-b border-black/10 px-25 text-lg lg:px-45">
      <Link
        href={"/"}
        className="font-nothing text-xl font-bold tracking-normal"
      >
        Recipe Notebook
      </Link>
      <div className="flex items-center gap-16 *:cursor-pointer">
        {session?.user ? (
          <>
            <AccountButton user={session.user} />
          </>
        ) : (
          <>
            <Link href={"/sign-in"}>Sign In</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
