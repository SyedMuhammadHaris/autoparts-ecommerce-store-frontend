import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const clients = new Set<QueryClient>();
afterEach(() => { clients.forEach(client => client.clear()); clients.clear(); });
export function renderWithQuery(ui: ReactElement, options?: RenderOptions) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.add(client);
  return { ...render(ui, { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>, ...options }), client };
}
