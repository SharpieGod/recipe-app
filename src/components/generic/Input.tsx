import { useId, type FC } from "react";
import { cn } from "~/lib/utils";

interface Input extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const Input: FC<Input> = ({
  className = "",
  label,
  ref,
  children,
  ...props
}) => {
  const id = useId();
  return (
    <div className="flex w-fit flex-col items-start justify-start">
      {label ? (
        <label className="text-text-500" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "focus:outline-accent-500 placeholder:text-text-500/50 cursor-text rounded-lg border border-black/10 p-2 transition-colors hover:border-black/20 focus:outline disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </input>
    </div>
  );
};

export default Input;
