import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { AccountStatusForm } from "@/features/admin/account-status-form";
import { ManagementFilterForm } from "@/features/admin/management-filter-form";
import { CustomerWorkspace } from "@/features/customers/customer-workspace";
import { StaffAccountEditor } from "@/features/admin/staff-account-editor";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
beforeEach(() => { (apiAction as jest.Mock).mockReset(); (clientFetch as jest.Mock).mockReset(); });
it("does not fetch customer data without customer-view permission", async () => {
  (clientFetch as jest.Mock).mockResolvedValue({ user: { is_staff: true, is_superuser: false, permissions: ["orders.view_order"] } });
  render(<CustomerWorkspace />);
  expect(await screen.findByRole("heading", { name: "Customer access required." })).toBeInTheDocument();
  expect(clientFetch).toHaveBeenCalledTimes(1);
});
it("submits only an audited account status and reason", async () => {
  (apiAction as jest.Mock).mockResolvedValue({});
  render(<AccountStatusForm id={7} active kind="customers" />);
  fireEvent.click(screen.getByLabelText("Account active"));
  fireEvent.change(screen.getByLabelText("Status change reason"), { target: { value: "customer_request" } });
  fireEvent.click(screen.getByRole("button", { name: "Save account status" }));
  await waitFor(() => expect(apiAction).toHaveBeenCalledWith(expect.objectContaining({ pathParams: { kind: "customers", id: 7 }, method: "POST", payload: { is_active: false, reason: "customer_request" } })));
  expect(screen.getByText(/revokes existing sessions/)).toBeInTheDocument();
});
it("protects superuser controls and validates audit actor filters", async () => {
  const { unmount } = render(<StaffAccountEditor selected={{ id: 1, is_superuser: true }} roles={[]} onSaved={jest.fn()} />);
  expect(screen.queryByRole("button", { name: "Save account status" })).not.toBeInTheDocument();
  unmount();
  const apply = jest.fn();
  render(<ManagementFilterForm audit onApply={apply} />);
  fireEvent.change(screen.getByLabelText("Actor number"), { target: { value: "invalid" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply search filters" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Use an actor number");
  expect(apply).not.toHaveBeenCalled();
});
