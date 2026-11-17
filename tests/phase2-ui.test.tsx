import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm } from "@/components/auth-form";
import { ProductOption } from "@/components/product-option";
import VerifyEmailPage from "@/app/verify-email/page";
import AdminPage from "@/app/admin/page";
import { apiRequest, ApiError } from "@/lib/api";
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiRequest: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
const request = apiRequest as jest.Mock;
beforeEach(() => request.mockReset());
it("shows signup fields and useful server validation without storing credentials", async () => {
  request.mockRejectedValue(new ApiError("Invalid", 400, { password: ["This password is too common."] }));
  render(<AuthForm register />);
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Customer" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "customer@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("This password is too common.");
  expect(request).toHaveBeenCalledWith("/api/auth/register", "POST", { name: "Customer", email: "customer@example.com", password: "password" });
  expect(localStorage.length).toBe(0);
});
it("keeps verification skippable when SMTP delivery is disabled", async () => {
  request.mockRejectedValue(new ApiError("Email delivery unavailable.", 503));
  render(<VerifyEmailPage />);
  fireEvent.click(screen.getByRole("button", { name: /send.*code/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("You can skip verification.");
  expect(screen.getByRole("link", { name: /skip for now/i })).toHaveAttribute("href", "/account");
});
it("changes the displayed variant price and stock without enabling ordering", () => {
  render(<ProductOption variants={[
    { id: 1, sku: "A", price: "100.00", quantity_available: 2, values: [] },
    { id: 2, sku: "B", price: "200.00", quantity_available: 0, values: [] },
  ]} />);
  expect(screen.getByText("2 available")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Product option"), { target: { value: "2" } });
  expect(screen.getByText("Out of stock")).toBeInTheDocument();
  expect(screen.getByText(/200/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /cart/i })).not.toBeInTheDocument();
});
it("denies customer access to the management workspace", async () => {
  request.mockResolvedValue({ user: { is_staff: false, permissions: [] } });
  render(<AdminPage />);
  expect(await screen.findByRole("heading", { name: "Staff access required." })).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(1);
});
it("shows only permitted management sections and no save control for read-only staff", async () => {
  request.mockImplementation((path: string) => Promise.resolve(path === "/api/auth/me" ? { user: { is_staff: true, is_superuser: false, permissions: ["catalog.view_product"] } } : { results: [], next: null }));
  render(<AdminPage />);
  await waitFor(() => expect(screen.getByText("No records yet.")).toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Products" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Staff roles" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
});
