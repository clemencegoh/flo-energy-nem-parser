import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // You can set default options for all queries here
      staleTime: Infinity, // Disable stale state by default (optional)
      retry: false, // Disable retry by default (optional)
      refetchOnMount: false, // Disable refetch on mount by default (optional)
      refetchOnWindowFocus: false, // Disable refetch on window focus by default (optional)
    },
  },
});

export default queryClient;