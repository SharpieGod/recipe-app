import type { FC } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const Button: FC<ButtonProps> = ({ className = "", children, ...props }) => {
  return (
    <button
      className={`cursor-pointer rounded-lg border border-black/10 p-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
