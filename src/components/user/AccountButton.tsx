"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useClickOutside } from "~/hooks/useClickOutside";
import { cn } from "~/lib/utils";
import Popdown from "../generic/Popdown";
import UserImage from "./UserImage";

type Props = {
  user: Session["user"];
};

const AccountButton = ({ user }: Props) => {
  return (
    <Popdown
      className="text-base"
      trigger={
        <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full">
          <UserImage user={user} />
        </button>
      }
    >
      <Link href="/my-recipes">My Recipes</Link>
      <button onClick={() => signOut()}>Sign Out</button>
    </Popdown>
  );
};

export default AccountButton;
