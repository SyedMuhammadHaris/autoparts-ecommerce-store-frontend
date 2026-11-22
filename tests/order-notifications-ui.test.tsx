import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { NotificationList } from "@/features/notifications/notification-list";
import { NotificationScreen } from "@/features/notifications/notification-screen";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
beforeEach(() => { (apiAction as jest.Mock).mockReset(); (clientFetch as jest.Mock).mockReset(); });
it("reads only the selected owned order and treats notification bodies as text", async () => {
  (clientFetch as jest.Mock).mockResolvedValue({ count: 1, results: [{ id: 1, order_reference: "a".repeat(24), subject: "Order shipped", body: "<script>unsafe()</script>", created_at: "2026-11-22T00:00:00Z", read_at: null }], next: null, previous: null });
  (apiAction as jest.Mock).mockResolvedValue({});
  render(<NotificationList reference={"a".repeat(24)} />);
  expect(await screen.findByRole("heading", { name: "Order shipped" })).toBeInTheDocument();
  expect(screen.getByText("<script>unsafe()</script>")).toBeInTheDocument();
  expect(document.querySelector("script")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
  await waitFor(() => expect(apiAction).toHaveBeenCalledWith(expect.objectContaining({ path: "/api/orders/{reference}/notifications", pathParams: { reference: "a".repeat(24) }, method: "POST", payload: { id: 1 } })));
});
it("requires sign-in before fetching a registered notification inbox", async () => {
  (clientFetch as jest.Mock).mockRejectedValue(new Error("Sign in"));
  render(<NotificationScreen />);
  expect(await screen.findByRole("link", { name: "Sign in to view account notifications" })).toBeInTheDocument();
  expect(clientFetch).toHaveBeenCalledTimes(1);
});
