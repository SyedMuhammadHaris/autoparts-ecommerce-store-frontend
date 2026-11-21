"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiAction, clientFetch } from "@/lib/api";
import { ApiError, apiPath, type ApiAction, type ApiOptions } from "@/lib/api/contracts";

export function apiKey(options: ApiOptions) { return ["api", apiPath(options)] as const; }
export function useApiQuery<T>(options: ApiOptions, enabled = true) {
  const query = useQuery<T>({ queryKey: apiKey(options), queryFn: ({ signal }) => clientFetch<T>({ ...options, signal }), enabled });
  // Refetch failures normally retain stale data; never retain private data after access is denied.
  const denied = query.error instanceof ApiError && [401, 403].includes(query.error.status);
  return { ...query, data: denied ? undefined : query.data };
}
export function useApiMutation<T, V>(action: (values: V) => ApiAction, invalidate: string[] = []) {
  const client = useQueryClient();
  return useMutation<T, Error, V>({ mutationFn: values => apiAction<T>(action(values)), retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ predicate: query => query.queryKey[0] === "api" && invalidate.some(path => String(query.queryKey[1]).startsWith(path)) });
    },
  });
}
