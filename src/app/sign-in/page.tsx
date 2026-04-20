import { redirect } from "next/navigation";
import Container from "~/components/Container";
import Navbar from "~/components/Navbar";
import SignInButton from "~/components/SignInButton";
import { auth } from "~/server/auth";

const SignInPage = async () => {
  const session = await auth();

  if (session) {
    return redirect("/");
  }

  return (
    <>
      <Container>
        <div className="flex scale-120 flex-col items-center justify-center gap-4 py-24 pt-30">
          <h1 className="text-4xl font-semibold">Sign in</h1>
          <p className="text-txet-500">
            Connect your account to create recipe books
          </p>

          <SignInButton provider="hackclub" />
          <SignInButton provider="discord" />
        </div>
      </Container>
    </>
  );
};

export default SignInPage;
