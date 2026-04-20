type Props = {
  children: React.ReactNode;
  className?: string;
};

const Container = ({ children, className }: Props) => {
  return (
    <div className={` ${className} mx-auto mt-8 h-full px-4 sm:w-4/5 xl:w-3/5`}>
      {children}
    </div>
  );
};

export default Container;
