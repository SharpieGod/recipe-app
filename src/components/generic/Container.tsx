type Props = {
  children: React.ReactNode;
  className?: string;
};

const Container = ({ children, className }: Props) => {
  return (
    <div
      className={` ${className} mx-auto mt-8 h-full px-4 pb-50 sm:w-4/5 xl:w-4/6`}
    >
      {children}
    </div>
  );
};

export default Container;
