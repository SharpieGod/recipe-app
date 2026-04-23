import { useQuery, useQueryClient } from "@tanstack/react-query";

const tempIdMapKey = ["tempIdMap"] as const;

export function useResolvedId(id: string) {
  const { data: map } = useQuery<Record<string, string>>({
    queryKey: tempIdMapKey,
    enabled: false,
    initialData: {},
    queryFn: () => ({}),
  });

  if (!id.startsWith("_tempid_")) return id;
  return map?.[id] ?? null;
}

export function useGetResolvedId() {
  const qc = useQueryClient();
  return (id: string) => {
    if (!id.startsWith("_tempid_")) return id;
    return qc.getQueryData<Record<string, string>>(tempIdMapKey)?.[id] ?? null;
  };
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
