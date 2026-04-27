"use client";
import { api } from "~/trpc/react";
import Container from "../generic/Container";
import Image from "next/image";
import { UNIT_LABELS, unitLabel } from "~/types";
import { isImperial, toMixedFraction } from "./edit/IngredientEdit";

type Props = {
  preview?: boolean;
  recipeId: string;
};

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}

const RecipeView = ({ recipeId, preview }: Props) => {
  const { data: recipe } = api.recipe.get.useQuery({ id: recipeId });

  return recipe ? (
    <Container className="text-text-700 flex flex-col gap-4 text-lg">
      <h1 className="text-text-700 text-5xl">
        {!preview ? recipe.title : recipe.title + " (preview)"}
      </h1>
      <div className="flex flex-col gap-2">
        <div className="text-text-500 flex gap-8">
          <span>Servings: {recipe.servings ?? "?"}</span>
          <span>
            Prep time:{" "}
            {recipe.prepTimeMinutes
              ? formatMinutesToTime(recipe.prepTimeMinutes)
              : "?"}
          </span>
          <span>
            Cook time:{" "}
            {recipe.cookTimeMinutes
              ? formatMinutesToTime(recipe.cookTimeMinutes)
              : "?"}
          </span>
        </div>
        {recipe.tags.length > 0 ? (
          <ul className="text-text-500 flex flex-wrap gap-2 text-base">
            {recipe.tags.map((t, i) => (
              <li
                key={i}
                className="rounded-full border border-black/10 p-1 px-2"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Image
        alt={recipe.title + " image"}
        src={recipe.imageUrl ?? "/placeholder.webp"}
        className="aspect-7/3 rounded-xl object-cover object-center shadow-md"
        width={1400}
        height={600}
      />
      <p className="text-text-700 whitespace-pre-line">
        {recipe.description.length > 0 ? recipe.description : "No description."}
      </p>
      <div className="mt-4 flex flex-row flex-wrap gap-12 lg:flex-nowrap">
        <ul className="bg-primary-100 border-primary-300 sticky top-26 flex h-fit shrink-0 basis-65 flex-col gap-4 rounded-xl border p-4">
          {recipe.ingredientGroups
            .filter((g) => g.ingredients.length > 0)
            .map((g) => (
              <li key={g.id} className="flex flex-col gap-1">
                <h1 className="text-xl">
                  {g.default ? "Ingredients" : g.label}:
                </h1>
                <ul className="flex flex-col">
                  {g.ingredients.map((i) => (
                    <li key={i.id}>
                      <span className="text-nowrap">
                        {isImperial(i.unit)
                          ? toMixedFraction(i.value)
                          : String(i.value)}{" "}
                        {UNIT_LABELS[i.unit]} {i.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
        <ul className="flex shrink flex-col gap-2">
          {recipe.steps.map((s, i) => (
            <li key={s.id}>
              <p>
                <span className="font-nothing mr-2 text-5xl font-bold">
                  {i + 1}.
                </span>
                <span className="text-xl">{s.instruction}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  ) : (
    <Container className="text-text-500">Loading...</Container>
  );
};

export default RecipeView;
