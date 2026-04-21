"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useClickOutside } from "~/hooks/click";
import { cn } from "~/lib/utils";
import Popdown from "./Popdown";

type Props = {
  user: Session["user"];
};

const AccountButton = ({ user }: Props) => {
  return (
    <Popdown
      className="text-base"
      trigger={
        <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full">
          {user.image ? (
            <Image
              src={user.image}
              alt="userimage"
              className="size-10"
              width={64}
              height={64}
            />
          ) : (
            <div className="bg-secondary-200 flex size-15 items-center justify-center">
              <span className="text-secondary-600 font-bold">
                {user.name?.charAt(0)!}
              </span>
            </div>
          )}
        </button>
      }
    >
      <Link href="/my-recipes">My Recipes</Link>
      <button onClick={() => signOut()}>Sign Out</button>
    </Popdown>
  );
};

export default AccountButton;
