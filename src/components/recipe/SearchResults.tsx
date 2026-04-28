"use client";

import InfiniteScroll from "react-infinite-scroll-component";
import { api, type RouterOutputs } from "~/trpc/react";
import RecipeItem from "./RecipeItem";
import Container from "../generic/Container";

type Props = {
  query: string;
};

const SearchResults = ({ query }: Props) => {
  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.recipe.search.useInfiniteQuery(
      { query, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: 0,
      },
    );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return <p className="text-text-500 py-4 text-center">Loading...</p>;
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={
        <p className="text-text-500 py-4 text-center text-sm">Loading...</p>
      }
      className=""
      endMessage={
        <p className="text-text-500 py-4 text-center text-sm">
          No more results
        </p>
      }
    >
      <ul className="grid grid-cols-2 gap-4">
        {items.map((recipe) => (
          <li key={recipe.id}>
            <RecipeItem
              recipe={recipe as RouterOutputs["user"]["getUserRecipes"][number]}
              canEdit={false}
              userId=""
            />
          </li>
        ))}
      </ul>
    </InfiniteScroll>
  );
};

export default SearchResults;
