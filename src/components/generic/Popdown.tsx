import { useRef, useState } from "react";
import { useClickOutside } from "~/hooks/useClickOutside";
import { cn } from "~/lib/utils";

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  openStyle?: string;
  closedStyle?: string;
  enabled?: boolean;
};

const Popdown = ({
  trigger,
  children,
  className,
  closedStyle,
  openStyle,
  enabled = true,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const ref = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setIsOpen(!isOpen && enabled)}>{trigger}</div>
      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "bg-background-50 absolute left-1/2 mt-2 flex h-fit w-40 -translate-x-1/2 flex-col items-center overflow-hidden rounded-xl border border-black/10 shadow-sm transition-[top,opacity] *:w-full *:cursor-pointer *:p-1 *:text-center *:transition-colors",
          {
            "pointer-events-none top-[calc(90%-1rem)] opacity-0": !isOpen,
            "*:hover:bg-background-100 top-[90%] opacity-100": isOpen,
          },
          className,
          { [closedStyle as string]: !isOpen },
          { [openStyle as string]: isOpen },
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Popdown;
