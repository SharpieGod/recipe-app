import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-background sticky top-0 left-0 z-100 flex w-full items-center justify-between border-b border-black/10 px-45 py-3 text-lg">
      <Link href={"/"} className="text-xl font-semibold tracking-normal">
        Recipe Notebook
      </Link>
      <div className="flex gap-16">
        <Link href={"/about"}>About</Link>
        <Link href={"/about"}>About</Link>
        <Link href={"/about"}>About</Link>
      </div>
    </nav>
  );
};

export default Navbar;
