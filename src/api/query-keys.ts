export const rootKeys = {
  catalog: ["catalog"] as const,
  course: (courseId: number) => ["course", courseId] as const,
};
