import { useState } from "react";
import { cn } from "~/lib/utils";

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const FullScreenPopup = ({ trigger, children, className }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(!isOpen)} className="h-fit w-fit">
        {trigger}
      </div>

      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-100 bg-black/50 backdrop-blur-xs",
          "transition-opacity duration-200",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div
          className={cn(
            "bg-background-100 z-101 mx-auto mt-40 w-100 rounded-xl border border-black/10 p-4 shadow-sm",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default FullScreenPopup;
