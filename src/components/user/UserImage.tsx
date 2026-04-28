import Image from "next/image";

type Props = {
  user: { name?: string | null; image?: string | null };
};

const UserImage = ({ user }: Props) => {
  return (
    <div className="flex size-10 items-center justify-center overflow-hidden rounded-full">
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
    </div>
  );
};

export default UserImage;
