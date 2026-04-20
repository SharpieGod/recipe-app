import Link from "next/link";
import Button from "~/components/Button";
import Container from "~/components/Container";
import Navbar from "~/components/Navbar";

const NotFound = () => {
  return (
    <>
      <Navbar />
      <Container>
        <h1 className="text-3xl">Page not found</h1>
        <p className="text-text/80 mt-4 mb-2">
          The page you are looking for doesn't exist.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </Container>
    </>
  );
};

export default NotFound;
