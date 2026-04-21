"use client";
import { signOut } from "next-auth/react";
import Button from "./generic/Button";

const SignOutButton = ({}) => {
  return (
    <Button variant="empty" className="" onClick={() => signOut()}>
      Logout
    </Button>
  );
};

export default SignOutButton;
