import type { FC } from "react";
import { cn } from "~/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: "empty" | "primary" | "secondary" | "accent";
}

const Button: FC<ButtonProps> = ({
  className = "",
  variant = "primary",
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-lg border border-black/10 p-2 shadow-sm transition-colors hover:border-black/20",
        {
          "bg-primary-200 hover:border-primary-400": variant === "primary",
          "bg-secondary-200 hover:border-secondary-400":
            variant === "secondary",
          "bg-accent-200 hover:border-accent-400": variant === "accent",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
