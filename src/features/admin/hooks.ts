import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { rootKeys } from "@/api/query-keys";
import type { Category } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { notify } from "@/lib/notify";

import { createCategory, deleteCategory, renameCategory } from "./api";

function useRefreshCategories() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: rootKeys.catalog });
  }, [queryClient]);
}

export function useCreateCategory() {
  const refresh = useRefreshCategories();
  return useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: (category) => {
      refresh();
      notify.success(`Category ${category.name} added.`);
    },
    onError: notify.error,
  });
}

export function useRenameCategory() {
  const refresh = useRefreshCategories();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameCategory(id, name),
    onSuccess: () => {
      refresh();
      notify.success("Category renamed.");
    },
    onError: notify.error,
  });
}

export function useDeleteCategory() {
  const refresh = useRefreshCategories();
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.id),
    onSuccess: () => {
      refresh();
      notify.success("Category deleted.");
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(
    async (category: Category): Promise<void> => {
      const confirmed = await confirm({
        title: "Delete this category?",
        description: `${category.name} will be removed. Categories that still have courses cannot be deleted.`,
        confirmLabel: "Delete category",
        cancelLabel: "Keep category",
        tone: "danger",
      });
      if (confirmed) mutate(category);
    },
    [confirm, mutate],
  );

  return { remove, isPending: mutation.isPending };
}
