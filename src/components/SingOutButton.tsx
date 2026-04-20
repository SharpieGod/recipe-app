"use client";
import { signOut } from "next-auth/react";
import Button from "./Button";

const SignOutButton = ({}) => {
  return (
    <button className="" onClick={() => signOut()}>
      Sign Out
    </button>
  );
};

export default SignOutButton;
