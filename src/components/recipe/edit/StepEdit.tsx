"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRecipeEdit } from "./RecipeEditContext";
import { api } from "~/trpc/react";
import { useGetResolvedId } from "~/hooks/useResolvedId";
import type { RecipeIncluded } from "~/types";
import TextArea from "~/components/generic/Textarea";

type Step = RecipeIncluded["steps"][number];

export const StepDragPreview = ({ step }: { step: Step }) => {
  return (
    <li className="bg-background-50 flex w-120 items-start gap-2 rounded-xl p-2 shadow-md">
      <GripVertical className="text-background-300 mt-1 size-5 shrink-0" />
      <span className="text-text-400 w-6 shrink-0 pt-0.5 text-sm">
        {step.order + 1}.
      </span>
      <span className="flex-1 text-sm">{step.instruction}</span>
    </li>
  );
};

export const StepEdit = ({ step }: { step: Step }) => {
  const getResolvedId = useGetResolvedId();
  const { localRecipe, setLocalRecipe } = useRecipeEdit();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, data: { type: "step" } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: [transition, "opacity 200ms ease"].filter(Boolean).join(", "),
    opacity: isDragging ? 0 : 1,
  };

  const { mutate: del } = api.step.delete.useMutation({
    onMutate() {
      setLocalRecipe((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps
            .filter((s) => s.id !== step.id)
            .map((s, idx) => ({ ...s, order: idx })),
        };
      });
    },
  });

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-background-50 flex w-120 max-w-full items-start justify-start gap-2 rounded-xl border border-black/10 p-3"
    >
      <button
        type="button"
        className="text-background-300 mt-1 cursor-grab self-center active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder step"
      >
        <GripVertical className="size-5 shrink-0" />
      </button>
      <span className="text-text-500 w-6 shrink-0 self-center text-sm">
        {step.order + 1}.
      </span>
      <TextArea
        className="bg-background-50 flex w-full resize-none text-sm focus:outline-none"
        rows={2}
        cols={50}
        value={step.instruction}
        placeholder="Step instruction"
        onChange={(e) =>
          setLocalRecipe({
            ...localRecipe,
            steps: localRecipe.steps.map((s) =>
              s.id === step.id ? { ...s, instruction: e.target.value } : s,
            ),
          })
        }
      />
      <button
        type="button"
        onClick={() => {
          const realId = getResolvedId(step.id);
          if (!realId) return;
          del({ id: realId });
        }}
      >
        <Trash2
          size={16}
          className="text-text-400 mt-2 shrink-0 cursor-pointer"
        />
      </button>
    </li>
  );
};
