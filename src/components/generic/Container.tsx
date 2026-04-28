type Props = {
  children: React.ReactNode;
  className?: string;
};

const Container = ({ children, className }: Props) => {
  return (
    <div
      className={` ${className} mx-auto mt-8 h-full max-w-270 px-4 pb-50 md:w-4/5`}
    >
      {children}
    </div>
  );
};

export default Container;
