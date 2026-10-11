import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Category } from "@/api/types";
import { InlineTitleForm } from "@/components/domain/inline-title-form";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesQuery } from "@/features/catalog";

import { useCreateCategory, useDeleteCategory, useRenameCategory } from "../hooks";

function CategoryRow({ category }: { category: Category }) {
  const [renaming, setRenaming] = useState(false);
  const rename = useRenameCategory();
  const deletion = useDeleteCategory();

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line px-1 py-3 last:border-b-0">
      {renaming ? (
        <div className="min-w-0 flex-1">
          <InlineTitleForm
            label="Category name"
            initialValue={category.name}
            submitLabel="Save"
            pending={rename.isPending}
            onSubmit={(name) => {
              rename.mutate(
                { id: category.id, name },
                {
                  onSuccess: () => {
                    setRenaming(false);
                  },
                },
              );
            }}
            onCancel={() => {
              setRenaming(false);
            }}
          />
        </div>
      ) : (
        <>
          <span className="min-w-0 flex-1 font-semibold">{category.name}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Rename ${category.name}`}
            onClick={() => {
              setRenaming(true);
            }}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${category.name}`}
            disabled={deletion.isPending}
            onClick={() => {
              void deletion.remove(category);
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </>
      )}
    </li>
  );
}

function AddCategory() {
  const [adding, setAdding] = useState(false);
  const create = useCreateCategory();

  if (!adding) {
    return (
      <Button
        onClick={() => {
          setAdding(true);
        }}
      >
        <Plus aria-hidden="true" />
        Add category
      </Button>
    );
  }
  return (
    <div className="w-full max-w-md">
      <InlineTitleForm
        label="Category name"
        submitLabel="Add category"
        pending={create.isPending}
        onSubmit={(name) => {
          create.mutate(name, {
            onSuccess: () => {
              setAdding(false);
            },
          });
        }}
        onCancel={() => {
          setAdding(false);
        }}
      />
    </div>
  );
}

export function Component() {
  const categories = useQuery(categoriesQuery());

  return (
    <div className="container-page max-w-3xl py-8">
      <title>Categories · Admin · Atrium</title>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Categories</h1>
        <AddCategory />
      </header>
      <p className="mt-1 mb-6 text-muted">
        Teachers choose one of these when they create a course.
      </p>
      {categories.isPending ? (
        <div role="status" aria-label="Loading categories" className="grid gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : null}
      {categories.isError ? (
        <ErrorState
          error={categories.error}
          title="Could not load categories"
          onRetry={() => {
            void categories.refetch();
          }}
        />
      ) : null}
      {categories.data?.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add the first category so teachers can file their courses."
        />
      ) : null}
      {categories.data && categories.data.length > 0 ? (
        <ul aria-label="Categories" className="rounded-card border border-line bg-surface px-4">
          {categories.data.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
