import type { Session } from "next-auth";
import Image from "next/image";

type Props = {
  user: Session["user"];
};

const AccountButton = ({ user }: Props) => {
  return (
    <>
      <pre>{JSON.stringify(user)}</pre>
      <button className="flex size-10 items-center justify-center overflow-hidden rounded-full">
        {user.image ? (
          <Image
            src={user.image}
            alt="userimage"
            className="size-10"
            width={64}
            height={64}
          />
        ) : (
          <div className="bg-accent-200 size-15">
            <span>{user.name}</span>
          </div>
        )}
      </button>
    </>
  );
};

export default AccountButton;
