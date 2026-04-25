"use client";
import { useState } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const data_: { name: string; items: number[] }[] = [
  { name: "Group one!", items: [1, 2, 3] },
  { name: "Group two!", items: [4, 5, 6] },
  { name: "Group three!", items: [] },
];

const SortableItem = ({ id }: { id: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-accent-300 cursor-grab rounded-lg p-2"
    >
      {id}
    </li>
  );
};

const GroupDroppable = ({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  return (
    <ul
      ref={setNodeRef}
      className={`flex min-h-12 flex-col gap-2 rounded-lg p-1 ${
        isOver ? "bg-accent-100" : ""
      }`}
    >
      {children}
    </ul>
  );
};

const DndTest = () => {
  const [data, setData] = useState(data_);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const groupIdFor = (idx: number) => `group-${idx}`;

  const findGroupIndex = (id: number) =>
    data.findIndex((g) => g.items.includes(id));

  // Resolve `over.id` to a group index — handles both item ids and group container ids
  const resolveTargetGroup = (overId: number | string) => {
    if (typeof overId === "string" && overId.startsWith("group-")) {
      return parseInt(overId.replace("group-", ""), 10);
    }
    return findGroupIndex(overId as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id;

    const sourceIdx = findGroupIndex(activeId);
    const targetIdx = resolveTargetGroup(overId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    if (sourceIdx === targetIdx) return;

    setData((prev) => {
      // If hovering over an item, insert at that item's index.
      // If hovering over the group container (empty group), insert at the end.
      const targetItems = prev[targetIdx]!.items;
      const insertAt =
        typeof overId === "string"
          ? targetItems.length
          : targetItems.indexOf(overId as number);

      return prev.map((g, i) => {
        if (i === sourceIdx) {
          return { ...g, items: g.items.filter((x) => x !== activeId) };
        }
        if (i === targetIdx) {
          const next = [...g.items];
          next.splice(insertAt, 0, activeId);
          return { ...g, items: next };
        }
        return g;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id;

    const groupIdx = findGroupIndex(activeId);
    if (groupIdx === -1) return;

    // If released over the group container itself (not a sibling item), no reorder needed
    if (typeof overId === "string") return;

    const items = data[groupIdx]!.items;
    const oldIndex = items.indexOf(activeId);
    const newIndex = items.indexOf(overId as number);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    setData((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, items: arrayMove(items, oldIndex, newIndex) }
          : g,
      ),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ul className="flex flex-col gap-4">
        {data.map((group, idx) => (
          <li key={group.name}>
            <span>{group.name}</span>
            <SortableContext
              items={group.items}
              strategy={verticalListSortingStrategy}
            >
              <GroupDroppable groupId={groupIdFor(idx)}>
                {group.items.map((item) => (
                  <SortableItem key={item} id={item} />
                ))}
              </GroupDroppable>
            </SortableContext>
          </li>
        ))}
      </ul>
    </DndContext>
  );
};

export default DndTest;
