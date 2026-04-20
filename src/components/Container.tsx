type Props = {
  children: React.ReactNode;
};

const Container = ({ children }: Props) => {
  return (
    <div className="mx-auto mt-8 h-full px-4 sm:w-4/5 xl:w-3/5">{children}</div>
  );
};

export default Container;
