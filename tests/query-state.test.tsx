import { act, screen, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { renderWithQuery } from "./helpers/render";
import { ApiProvider, authStateChanged } from "@/lib/query/provider";
import { ApiError } from "@/lib/api/contracts";
import { useApiQuery } from "@/lib/query/hooks";
import { clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), clientFetch: jest.fn() }));
const fetcher = jest.mocked(clientFetch);
beforeEach(() => { jest.clearAllMocks(); });
function CacheProbe() {
  const client = useQueryClient();
  return <><span>{String(client.getQueryData(["private"]) ?? "empty")}</span><button onClick={() => { client.setQueryData(["private"], "old-customer"); authStateChanged(); }}>Change account</button></>;
}
it("replaces the browser cache and remounts observers on account changes", async () => {
  const view = renderWithQuery(<ApiProvider><CacheProbe /></ApiProvider>);
  await act(async () => { screen.getByRole("button", { name: "Change account" }).click(); });
  expect(screen.getByText("empty")).toBeInTheDocument();
  expect(screen.queryByText("old-customer")).not.toBeInTheDocument();
  view.unmount();
});
function AccountProbe() {
  const account = useApiQuery<{ name: string }>({ path: "/api/account/me" });
  return <><span>{account.data?.name ?? "private data hidden"}</span><button onClick={() => account.refetch()}>Refetch</button></>;
}
it("hides previously cached customer data when a refetch loses authorization", async () => {
  fetcher.mockResolvedValueOnce({ name: "customer-one" }).mockRejectedValue(new ApiError("Sign in", 401));
  renderWithQuery(<AccountProbe />);
  await screen.findByText("customer-one");
  await act(async () => { screen.getByRole("button", { name: "Refetch" }).click(); });
  await waitFor(() => expect(screen.queryByText("customer-one")).not.toBeInTheDocument());
  expect(screen.getByText("private data hidden")).toBeInTheDocument();
});
