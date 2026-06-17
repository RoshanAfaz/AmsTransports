import { QueryClient } from "@tanstack/react-query";

interface QueryLoaderOptions<T> {
  queryClient: QueryClient;
  queryKey: string[];
  queryFn: () => Promise<T>;
}

export async function swrLoader<T>({ queryClient, queryKey, queryFn }: QueryLoaderOptions<T>) {
  const cached = queryClient.getQueryData<T>(queryKey);
  if (cached) {
    // Silently trigger background fetch to update the query cache
    queryClient.prefetchQuery({ queryKey, queryFn }).catch(() => {});
    // Instantly return the cached data to prevent route transition blocking
    return cached;
  }
  
  // First-time visit: wait for the query to resolve
  return queryClient.ensureQueryData({ queryKey, queryFn });
}
