type Props = {
  children: React.ReactNode;
};

const Container = ({ children }: Props) => {
  return (
    <div className="mx-auto h-full bg-red-100 px-4 sm:w-4/5 lg:w-3/5">
      {children}
    </div>
  );
};

export default Container;
