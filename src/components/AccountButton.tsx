"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useClickOutside } from "~/hooks/click";

type Props = {
  user: Session["user"];
};

const AccountButton = ({ user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full"
      >
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

      {isOpen ? (
        <div
          onClick={() => setIsOpen(false)}
          className="bg-background-50 *:hover:bg-background-100 absolute top-10 left-1/2 mt-2 flex h-fit w-40 -translate-x-1/2 flex-col items-center overflow-hidden rounded-xl border border-black/10 shadow-sm *:w-full *:cursor-pointer *:p-1 *:text-center *:transition-colors"
        >
          <Link href="/myrecipes">Your Recipes</Link>
          <button className="" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AccountButton;
