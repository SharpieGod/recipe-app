"use client";
import { signIn } from "next-auth/react";
import Button from "./Button";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  provider: string;
};
const proiverNames: Record<string, { label: string; image: ReactNode }> = {
  hackclub: {
    label: "Hack Club",
    image: (
      <Image
        src="icon-rounded.svg"
        alt="hackclub logo"
        width={24}
        height={24}
      />
    ),
  },
  discord: {
    label: "Discord",
    image: (
      <Image
        src="Discord-Symbol-Blurple.svg"
        alt="hackclub logo"
        width={24}
        height={24}
      />
    ),
  },
};

const SignInButton = ({ provider }: Props) => {
  const { label, image: providerImage } = proiverNames[provider]!;

  return (
    <Button className="flex gap-2" onClick={() => signIn(provider)}>
      {providerImage}
      Sign in with {label}
    </Button>
  );
};

export default SignInButton;
