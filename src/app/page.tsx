import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Container>
        <h1 className="text-3xl">This is the homepage</h1>
      </Container>
    </>
  );
};

export default HomePage;
