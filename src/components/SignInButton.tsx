"use client";
import { signIn } from "next-auth/react";
import Button from "./Button";
import Image from "next/image";

type Props = {
  provider: string;
};

const SignInButton = ({ provider }: Props) => {
  return (
    <Button className="flex gap-2" onClick={() => signIn(provider)}>
      <Image
        src="icon-rounded.svg"
        alt="hackclub logo"
        width={24}
        height={24}
      />
      Sign in with {provider}
    </Button>
  );
};

export default SignInButton;
