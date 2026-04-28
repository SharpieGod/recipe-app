import { HydrateClient } from "~/trpc/server";
import SearchResults from "~/components/recipe/SearchResults";
import Navbar from "~/components/generic/Navbar";
import Input from "~/components/generic/Input";
import Container from "~/components/generic/Container";

type Props = {
  searchParams: Promise<{ query?: string }>;
};

const SearchPage = async ({ searchParams }: Props) => {
  const { query } = await searchParams;

  return (
    <>
      <Navbar />
      <Container className="flex flex-col gap-8">
        <form action="/search" method="GET">
          <Input
            label="Search"
            placeholder="Search for recipes!"
            name="query"
            defaultValue={query ?? ""}
          />
        </form>
        <HydrateClient>
          <SearchResults query={query ?? ""} />
        </HydrateClient>
      </Container>
    </>
  );
};

export default SearchPage;
