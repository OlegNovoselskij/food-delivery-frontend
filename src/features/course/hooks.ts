import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { courseDetailQuery, courseProgramQuery } from "./api";

function ignoreFailure(): void {
  return;
}

export function usePrefetchCourse(): (courseId: number) => void {
  const queryClient = useQueryClient();
  return useCallback(
    (courseId: number) => {
      queryClient.query(courseDetailQuery(courseId)).catch(ignoreFailure);
      queryClient.query(courseProgramQuery(courseId)).catch(ignoreFailure);
    },
    [queryClient],
  );
}
