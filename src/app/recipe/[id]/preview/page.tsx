import Container from "~/components/generic/Container";
import Navbar from "~/components/generic/Navbar";

type Props = {
  params: Promise<{ id: string }>;
};

const PreviewRecipePage = async ({ params }: Props) => {
  const { id } = await params;

  return (
    <>
      <Navbar />
      <Container>{id}</Container>
    </>
  );
};

export default PreviewRecipePage;
