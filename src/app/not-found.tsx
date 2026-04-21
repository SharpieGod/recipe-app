import Link from "next/link";
import Button from "~/components/generic/Button";
import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";

const NotFound = () => {
  return (
    <>
      <Navbar />
      <Container className="">
        <h1 className="text-3xl">Page not found</h1>
        <p className="text-text-800 mt-4 mb-2">
          The page you are looking for doesn't exist.
        </p>
        <Link href="/">
          <Button variant="secondary">Return Home</Button>
        </Link>
      </Container>
    </>
  );
};

export default NotFound;
