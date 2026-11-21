import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { TransferForm } from "@/features/payments/transfer-form";
import { PaymentWorkspace } from "@/features/payments/payment-workspace";
import { PaymentPanel } from "@/features/payments/payment-panel";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
const action = apiAction as jest.Mock;
const fetcher = clientFetch as jest.Mock;
const bank = { id: 1, name: "Test bank", bank_name: "Synthetic bank", account_title: "Test store", account_number: "TEST-ONLY", iban: "", instructions: "Local test instructions" };
beforeEach(() => { action.mockReset(); fetcher.mockReset(); });

it("validates transfer fields before submitting a reference for review", async () => {
  action.mockResolvedValue({});
  render(<TransferForm reference={"a".repeat(24)} banks={[bank]} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit transfer for review" }));
  await screen.findByRole("alert");
  expect(action).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Receiving bank account"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Bank transaction reference"), { target: { value: " REF-123 " } });
  fireEvent.click(screen.getByRole("button", { name: "Submit transfer for review" }));
  await waitFor(() => expect(action).toHaveBeenCalledWith(expect.objectContaining({ method: "POST", payload: { bank_account: 1, reference: "REF-123" } })));
  expect(screen.getByText(/does not confirm payment/)).toBeInTheDocument();
});

it("keeps a submitted transfer awaiting manual review without a second submission form", async () => {
  fetcher.mockResolvedValue({ method: "bank_transfer", status: "awaiting_transfer", amount: "100.00", currency: "PKR", bank_accounts: [bank], submissions: [{ id: 1, reference: "REF", bank, decision: null, note: null }] });
  render(<PaymentPanel reference={"a".repeat(24)} status="pending" />);
  expect(await screen.findByText(/REF · Awaiting review/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Submit transfer for review" })).not.toBeInTheDocument();
  expect(screen.getByText(/reservation deadline still applies/)).toBeInTheDocument();
});

it("denies customers access to payment management before fetching payment data", async () => {
  fetcher.mockResolvedValue({ user: { is_staff: false, is_superuser: false, permissions: [] } });
  render(<PaymentWorkspace />);
  expect(await screen.findByRole("heading", { name: "Payment access required." })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("shows payment orders to authorized staff and hides collection before delivery", async () => {
  const user = { is_staff: true, is_superuser: false, permissions: ["payments.view_payment", "payments.confirm_cod", "payments.collect_payment"] };
  fetcher.mockImplementation(({ path }: { path: string }) => Promise.resolve(path === "/api/account/me" ? { user } : path === "/api/admin/payments" ? { results: [{ id: 1, reference: "ORDER-TEST", method: "cod", payment_status: "pending_collection" }], next: null, previous: null } : { id: 1, order: { reference: "ORDER-TEST", status: "pending" }, payment: { method: "cod", status: "pending_collection", amount: "100.00", submissions: [] } }));
  render(<PaymentWorkspace />);
  fireEvent.click(await screen.findByRole("button", { name: "ORDER-TEST" }));
  expect(await screen.findByRole("button", { name: "Confirm COD order (no collection)" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Record COD collection" })).not.toBeInTheDocument();
});
