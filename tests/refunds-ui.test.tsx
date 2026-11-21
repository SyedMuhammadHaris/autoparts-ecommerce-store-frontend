import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { RefundRequestForm } from "@/features/refunds/refund-request-form";
import { RefundResolutionForm } from "@/features/refunds/refund-resolution-form";
import { RefundWorkspace } from "@/features/refunds/refund-workspace";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
const action = apiAction as jest.Mock;
const fetcher = clientFetch as jest.Mock;
beforeEach(() => { action.mockReset(); fetcher.mockReset(); });

it("rejects zero refunds and creates only an authorization with a stable request key", async () => {
  action.mockRejectedValue(new Error("synthetic"));
  render(<RefundRequestForm />);
  fireEvent.change(screen.getByLabelText("Inspected return request number"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Refund amount (PKR)"), { target: { value: "0.00" } });
  fireEvent.change(screen.getByLabelText("Reason and policy basis"), { target: { value: "Refund per configured policy" } });
  fireEvent.click(screen.getByRole("button", { name: "Authorize refund (no payout)" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("greater than zero");
  expect(action).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Refund amount (PKR)"), { target: { value: "100.00" } });
  fireEvent.click(screen.getByRole("button", { name: "Authorize refund (no payout)" }));
  await screen.findByText(/Retry the same request/);
  const key = action.mock.calls[0][0].payload.idempotency_key;
  fireEvent.click(screen.getByRole("button", { name: "Authorize refund (no payout)" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  expect(action.mock.calls[1][0].payload.idempotency_key).toBe(key);
});

it("requires actual receipt and explicit acknowledgement before recording an offline refund", async () => {
  action.mockResolvedValue({});
  render(<RefundResolutionForm id={1} />);
  fireEvent.change(screen.getByLabelText("Refund resolution"), { target: { value: "complete" } });
  fireEvent.change(screen.getByLabelText("Resolution note"), { target: { value: "Offline bank payment checked" } });
  fireEvent.click(screen.getByRole("button", { name: "Record refund resolution" }));
  const error = await screen.findByRole("alert");
  expect(error).toHaveTextContent("actual offline refund receipt");
  expect(error).toHaveTextContent("Confirm that the offline refund was paid");
  expect(action).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Offline refund receipt reference"), { target: { value: "TEST-RECEIPT" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Record refund resolution" }));
  await waitFor(() => expect(action).toHaveBeenCalledWith(expect.objectContaining({ payload: { action: "complete", note: "Offline bank payment checked", reference: "TEST-RECEIPT" } })));
});

it("does not load refund records for customers", async () => {
  fetcher.mockResolvedValue({ user: { is_staff: false, is_superuser: false, permissions: [] } });
  render(<RefundWorkspace />);
  expect(await screen.findByRole("heading", { name: "Refund access required." })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
