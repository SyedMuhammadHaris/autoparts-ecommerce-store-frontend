import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { ReturnPanel } from "@/features/returns/return-panel";
import { ReturnForm } from "@/features/returns/return-form";
import { InspectionForm } from "@/features/returns/inspection-form";
import { ReturnWorkspace } from "@/features/returns/return-workspace";
import { resourceSchema } from "@/features/admin/schemas";
import { resources } from "@/features/admin/resources";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
const action = apiAction as jest.Mock;
const fetcher = clientFetch as jest.Mock;
beforeEach(() => { action.mockReset(); fetcher.mockReset(); });

it("does not offer a return until an explicit policy makes the order eligible", async () => {
  fetcher.mockResolvedValue({ policy: null, eligible: false, items: [], requests: [] });
  render(<ReturnPanel reference={"a".repeat(24)} />);
  expect(await screen.findByText(/until the store configures/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Request return" })).not.toBeInTheDocument();
});

it("validates remaining quantities and reuses the key when retrying the same return", async () => {
  action.mockRejectedValue(new Error("synthetic failure"));
  render(<ReturnForm reference={"a".repeat(24)} items={[{ id: 1, name: "Brake pad", sku: "PAD", remaining: 2 }]} />);
  fireEvent.change(screen.getByLabelText("Return reason"), { target: { value: "Wrong fit" } });
  fireEvent.change(screen.getByLabelText(/Return quantity/), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Request return" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Cannot exceed");
  expect(action).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Return quantity/), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Request return" }));
  await screen.findByText(/Retry the same request/);
  const first = action.mock.calls[0][0];
  fireEvent.click(screen.getByRole("button", { name: "Request return" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  expect(action.mock.calls[1][0].payload.idempotency_key).toBe(first.payload.idempotency_key);
});

it("requires an explicit inspected quantity and allows zero restock for damaged items", async () => {
  action.mockResolvedValue({});
  const entry = { id: 1, order_reference: "TEST", status: "approved", reason: "Test", policy: { name: "Test", is_enabled: true, window_days: 14, shipping_refund_policy: "Test", tax_refund_policy: "Test", instructions: "" }, items: [{ id: 1, name: "Pad", sku: "PAD", quantity: 2, restock_quantity: null }], events: [] };
  render(<InspectionForm entry={entry} />);
  fireEvent.change(screen.getByLabelText("Customer-facing inspection note"), { target: { value: "Damaged on inspection" } });
  fireEvent.click(screen.getByRole("button", { name: "Record inspection and restock" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Explicitly enter");
  fireEvent.change(screen.getByLabelText(/Sellable quantity/), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Record inspection and restock" }));
  await waitFor(() => expect(action).toHaveBeenCalledWith(expect.objectContaining({ payload: { action: "receive", note: "Damaged on inspection", items: [{ return_item: 1, restock_quantity: 0 }] } })));
});

it("enforces policy configuration in the admin schema and denies customer management access", async () => {
  const schema = resourceSchema(resources.find(resource => resource.key === "return-policies")!, false);
  const base = { name: "Draft", is_enabled: false, window_days: "", shipping_refund_policy: "", tax_refund_policy: "", instructions: "" };
  expect(schema.parse(base).window_days).toBeNull();
  expect(schema.safeParse({ ...base, is_enabled: true }).success).toBe(false);
  fetcher.mockResolvedValue({ user: { is_staff: false, is_superuser: false, permissions: [] } });
  render(<ReturnWorkspace />);
  expect(await screen.findByRole("heading", { name: "Return access required." })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
