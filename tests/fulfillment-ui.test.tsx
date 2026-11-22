import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { FulfillmentForm } from "@/features/fulfillment/fulfillment-form";
import { FulfillmentReview } from "@/features/fulfillment/fulfillment-review";
import { FulfillmentWorkspace } from "@/features/fulfillment/fulfillment-workspace";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
const action = apiAction as jest.Mock;
const fetcher = clientFetch as jest.Mock;
beforeEach(() => { action.mockReset(); fetcher.mockReset(); });

it("requires carrier and tracking information before shipping", async () => {
  action.mockResolvedValue({});
  render(<FulfillmentForm id={1} target="shipped" />);
  fireEvent.click(screen.getByRole("button", { name: "Mark shipped" }));
  await screen.findByRole("alert");
  expect(action).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Carrier name"), { target: { value: "Test carrier" } });
  fireEvent.change(screen.getByLabelText("Tracking reference"), { target: { value: "TEST-1" } });
  fireEvent.click(screen.getByRole("button", { name: "Mark shipped" }));
  await waitFor(() => expect(action).toHaveBeenCalledWith(expect.objectContaining({ method: "POST", payload: { target: "shipped", carrier: "Test carrier", tracking_reference: "TEST-1" } })));
});

it("requires payment before completing a delivered COD order", async () => {
  fetcher.mockResolvedValue({ reference: "TEST", status: "delivered", payment: { status: "pending_collection" }, address: { name: "Test", line1: "Test", city: "Test" }, items: [], history: [] });
  render(<FulfillmentReview id={1} canFulfill />);
  expect(await screen.findByText(/Payment must be verified or collected/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Mark completed" })).not.toBeInTheDocument();
});

it("does not load fulfillment data for customers", async () => {
  fetcher.mockResolvedValue({ user: { is_staff: false, is_superuser: false, permissions: [] } });
  render(<FulfillmentWorkspace />);
  expect(await screen.findByRole("heading", { name: "Order access required." })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
