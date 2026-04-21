import { useId, type FC } from "react";
import { cn } from "~/lib/utils";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  label?: string;
}

const TextArea: FC<TextAreaProps> = ({
  className = "",
  label,
  children,
  ...props
}) => {
  const id = useId();
  return (
    <div className="flex flex-col items-start justify-start">
      {label ? (
        <label className="" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        className={cn(
          "focus:outline-accent-500 placeholder:text-text-500/50 cursor-text rounded-lg border border-black/10 p-2 shadow-sm transition-colors hover:border-black/20 focus:outline disabled:cursor-not-allowed disabled:opacity-50",

          className,
        )}
        {...props}
      >
        {children}
      </textarea>
    </div>
  );
};

export default TextArea;
