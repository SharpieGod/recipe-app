import Container from "~/components/Container";
import Navbar from "~/components/Navbar";

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
