import { useQuery, useQueryClient } from "@tanstack/react-query";

const tempIdMapKey = ["tempIdMap"] as const;

export function useResolvedId(id: string) {
  if (!id.startsWith("_tempid_")) {
    return id;
  }

  const { data: map } = useQuery<Record<string, string>>({
    queryKey: tempIdMapKey,
    enabled: false,
    initialData: {},
    queryFn: () => ({}),
  });
  return map?.[id] ?? null;
}

export function useSetResolvedId() {
  const qc = useQueryClient();
  return (tempId: string, realId: string) => {
    qc.setQueryData<Record<string, string>>(tempIdMapKey, (prev) => ({
      ...(prev ?? {}),
      [tempId]: realId,
    }));
  };
}
