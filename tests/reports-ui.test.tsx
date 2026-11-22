import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { ReportWorkspace } from "@/features/reports/report-workspace";
import { ReportFilterForm } from "@/features/reports/report-filter-form";
import { ReportSummary } from "@/features/reports/report-summary";
import { clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), clientFetch: jest.fn() }));
const fetcher = clientFetch as jest.Mock;
beforeEach(() => fetcher.mockReset());
it("does not load reports for staff without explicit report permission", async () => {
  fetcher.mockResolvedValue({ user: { is_staff: true, is_superuser: false, permissions: ["orders.view_order"] } });
  render(<ReportWorkspace />);
  expect(await screen.findByRole("heading", { name: "Report access required." })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("validates inclusive date order and passes applied filters", async () => {
  const apply = jest.fn();
  render(<ReportFilterForm initial={{ start: "2026-11-30", end: "2026-11-01", low_stock: "5" }} onApply={apply} />);
  fireEvent.click(screen.getByRole("button", { name: "Apply report filters" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("end on or after start");
  expect(apply).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("End date (UTC, inclusive)"), { target: { value: "2026-11-30" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply report filters" }));
  await waitFor(() => expect(apply).toHaveBeenCalledWith({ start: "2026-11-30", end: "2026-11-30", low_stock: "5" }, expect.anything()));
});
it("separates financial event totals from current low-stock alerts", () => {
  render(<ReportSummary report={{ generated_at: "2026-11-22T00:00:00Z", timezone: "UTC", currency: "PKR", start: "2026-11-01", end: "2026-11-30", orders_placed: 1, active_order_value: "100.00", cod_collected: "0.00", bank_verified: "0.00", completed_refunds: "25.00", net_recorded_receipts: "-25.00", order_statuses: [{ status: "delivered", count: 1 }], low_stock_count: 1, low_stock_threshold: 5, low_stock: [{ id: 1, sku: "PAD", name: "Test pad", location: "Main", on_hand: 3, reserved: 1, available: 2 }] }} />);
  expect(screen.getByText("Net recorded receipts")).toBeInTheDocument();
  expect(screen.getByText(/independent of the date range/)).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "PAD · Test pad" })).toBeInTheDocument();
});
