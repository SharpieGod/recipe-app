"use client";
import { api } from "~/trpc/react";
import Container from "../generic/Container";
import Image from "next/image";
import {
  UNIT_LABELS,
  imperialToMetric,
  metricToImperial,
  roundMetric,
} from "~/types";
import type { Metric, Imperical } from "~/types";
import { isImperial, toMixedFraction } from "./edit/IngredientEdit";
import type { Unit } from "generated/prisma";

const METRIC_UNITS = new Set<Unit>(["MILLILITER", "LITER", "GRAM", "KILOGRAM"]);
const isMetricUnit = (unit: Unit): unit is Metric => METRIC_UNITS.has(unit);

function displayIngredient(
  value: number,
  unit: Unit,
  scale: number,
  metric: boolean,
): { text: string; unitLabel: string } {
  const scaled = value * scale;
  if (unit === "NONE") return { text: toMixedFraction(scaled), unitLabel: "" };

  if (metric && isImperial(unit)) {
    const conv = imperialToMetric(scaled, unit as Imperical);
    return {
      text: String(roundMetric(conv.value, conv.unit)),
      unitLabel: UNIT_LABELS[conv.unit],
    };
  }

  if (!metric && isMetricUnit(unit)) {
    const conv = metricToImperial(scaled, unit);
    return {
      text: toMixedFraction(conv.value, conv.unit),
      unitLabel: UNIT_LABELS[conv.unit],
    };
  }

  return {
    text: isImperial(unit)
      ? toMixedFraction(scaled, unit)
      : String(roundMetric(scaled, unit as Metric)),
    unitLabel: UNIT_LABELS[unit],
  };
}

import UserImage from "../user/UserImage";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

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

  const { data: rating, isPending: ratingsPending } =
    api.recipe.getRating.useQuery({ id: recipeId });

  const [scale, setScale] = useState(1);
  const [isMetricOverride, setIsMetric] = useState<boolean | null>(null);
  const defaultIsMetric = useMemo(() => {
    if (!recipe) return false;
    let metric = 0,
      imperial = 0;
    for (const g of recipe.ingredientGroups)
      for (const i of g.ingredients) {
        if (i.unit === "NONE") continue;
        isMetricUnit(i.unit) ? metric++ : imperial++;
      }
    return metric > imperial;
  }, [recipe]);
  const isMetric = isMetricOverride ?? defaultIsMetric;

  return recipe ? (
    <Container className="text-text-700 flex flex-col gap-4 text-lg">
      <div className="flex flex-col gap-1">
        <h1 className="text-text-700 text-5xl">
          {recipe.title}{" "}
          {!recipe.publishedAt ? (
            <span className="text-text-300">(preview)</span>
          ) : null}
        </h1>

        <Link
          href={`/user-recipes/${recipe.user.id}`}
          className="flex w-fit items-center gap-1"
        >
          <div className="scale-80">
            <UserImage user={recipe.user} />
          </div>
          <span className="text-text-500">{recipe.user.name}</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-text-500 flex gap-8">
          <span className="flex items-center gap-1">
            Servings: {recipe.servings}
          </span>
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
        className="aspect-7/3 rounded-xl object-cover object-center"
        width={1400}
        height={600}
      />

      <p className="text-text-700 whitespace-pre-line">
        {recipe.description.length > 0 ? recipe.description : "No description."}
      </p>
      <div className="mt-4 flex flex-row flex-wrap gap-12 lg:flex-nowrap">
        <ul className="bg-primary-100 border-primary-300 top-26 flex h-fit shrink-0 basis-85 flex-col gap-2 rounded-xl border p-4 lg:sticky">
          <ul className="text-primary-600 flex gap-2 text-base">
            {(["imperial", "metric"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setIsMetric(m === "metric")}
                className={cn(
                  "border-primary-200 bg-primary-200/30 cursor-pointer rounded-xl border px-2 py-0.5 transition-colors",
                  { "bg-primary-200": isMetric === (m === "metric") },
                )}
              >
                {m}
              </button>
            ))}
          </ul>
          <ul className="text-primary-600 flex gap-2 text-base">
            {[0.5, 1, 2, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setScale(n)}
                className={cn(
                  "border-primary-200 bg-primary-200/30 flex cursor-pointer items-center gap-0.5 rounded-xl border px-2 py-0.5 transition-colors",
                  { "bg-primary-200": scale == n },
                )}
              >
                <X size={11} />
                <span>{n}</span>
              </button>
            ))}
          </ul>

          <span className="text-text-500 text-base">
            Makes {(recipe.servings ?? 0) * scale}
          </span>
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
                      {(() => {
                        const d = displayIngredient(
                          i.value,
                          i.unit,
                          scale,
                          isMetric,
                        );
                        return (
                          <div className="flex gap-2 text-nowrap">
                            <span>
                              {d.text} {d.unitLabel}
                            </span>
                            <span className="text-text-500">{i.label}</span>
                          </div>
                        );
                      })()}
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
                <span className="font-nothing mr-4 text-5xl font-bold">
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
