import Link from "next/link";
import { auth } from "~/server/auth";
import Navbar from "~/components/generic/Navbar";
import Button from "~/components/generic/Button";
import Container from "~/components/generic/Container";

const HomePage = async () => {
  const session = await auth();

  return (
    <>
      <Navbar />

      <Container>Homepage</Container>
    </>
  );
};

export default HomePage;
