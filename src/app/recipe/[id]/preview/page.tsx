type Props = {
  params: Promise<{ id: string }>;
};

const PreviewRecipePage = async ({ params }: Props) => {
  const { id } = await params;

  return <div>{id}</div>;
};

export default PreviewRecipePage;
