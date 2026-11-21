"use client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/contracts";
import { notifyError } from "@/lib/notifications";

export function createQueryClient() {
  return new QueryClient({ queryCache: new QueryCache({ onError: (error, query) => {
    if (query.meta?.notifyErrors === false) return;
    // Anonymous account probes are expected; background retries notify only on final failure.
    if (error instanceof ApiError && error.status === 401 && query.state.data === undefined) return;
    notifyError(error);
  } }), defaultOptions: {
    queries: { staleTime: 0, gcTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
      retry: (count, error) => count < 1 && error instanceof ApiError && error.status >= 500 },
    mutations: { retry: false },
  } });
}
export function authStateChanged() { window.dispatchEvent(new Event("auth-changed")); }
export function ApiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({ client: createQueryClient(), generation: 0 }));
  useEffect(() => {
    const reset = () => {
      void state.client.cancelQueries(); state.client.clear();
      setState(previous => ({ client: createQueryClient(), generation: previous.generation + 1 }));
    };
    window.addEventListener("auth-changed", reset);
    return () => window.removeEventListener("auth-changed", reset);
  }, [state.client]);
  return <QueryClientProvider client={state.client}><div key={state.generation} className="api-boundary">{children}</div></QueryClientProvider>;
}
