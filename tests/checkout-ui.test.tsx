import { renderWithQuery as render } from "./helpers/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CheckoutPage } from "@/features/checkout/checkout-page";
import { OrderPage } from "@/features/checkout/order-page";
import { apiRequest, ApiError } from "@/lib/api";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  const { apiPath } = jest.requireActual("@/lib/api/contracts");
  const request = jest.fn();
  return { ...actual, apiRequest: request,
    clientFetch: (options: import("@/lib/api/contracts").ApiOptions) => request(apiPath(options)),
    apiAction: (options: import("@/lib/api/contracts").ApiAction) => request(apiPath(options), options.method, options.payload),
  };
});
const push = jest.fn();
const replace = jest.fn();
const router = { push, replace };
jest.mock("next/navigation", () => ({ useRouter: () => router }));
const request = jest.mocked(apiRequest);
const cart = { revision: 2, item_count: 1, subtotal: "1000.00", currency: "PKR", items: [{ variant: 1, name: "Brake pad", sku: "PAD", quantity: 1 }] };
const options = { configured: true, cities: [{ id: 1, name: "Test city", zone_id: 1 }], rates: [{ id: 2, name: "Standard", zone_id: 1, fee: "250.00" }], payment_methods: [{ id: "cod", name: "Cash on Delivery" }] };
const quote = { subtotal: "1000.00", discount: "0.00", tax: "0.00", tax_percent: "0.000", shipping_fee: "250.00", total: "1250.00", quote_token: "signed-test-quote", reservation_minutes: 30, valid_for_seconds: 600 };
beforeEach(() => {
  jest.clearAllMocks(); sessionStorage.clear();
  request.mockImplementation(async path => path === "/api/cart" ? cart : path === "/api/shipping" ? options : path === "/api/checkout/quote" ? quote : { reference: "a".repeat(24) });
});

async function review() {
  await screen.findByLabelText("Full name");
  for (const [label, value] of [["Full name", "Test Customer"], ["Email", "test@example.invalid"], ["Phone", "+923001234567"], ["Address line 1", "Test street 1"]]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.change(screen.getByLabelText("City"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Delivery method"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Payment method"), { target: { value: "cod" } });
  fireEvent.click(screen.getByRole("button", { name: "Review final total" }));
  await screen.findByRole("button", { name: /place order/i });
}

it("blocks unconfigured checkout while keeping the cart", async () => {
  request.mockImplementation(async path => path === "/api/cart" ? cart : { ...options, configured: false });
  render(<CheckoutPage />);
  expect(await screen.findByText(/Ordering is temporarily unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /place order/i })).not.toBeInTheDocument();
});
it("reviews server totals, places an order and stores no customer details in sessionStorage", async () => {
  render(<CheckoutPage />); await review();
  fireEvent.click(screen.getByRole("button", { name: /place order/i }));
  await waitFor(() => expect(push).toHaveBeenCalledWith(`/orders/${"a".repeat(24)}`));
  const body = request.mock.calls.find(call => call[0] === "/api/checkout")![2] as Record<string, unknown>;
  expect(body.quote_token).toBe("signed-test-quote");
  expect(body.total).toBeUndefined();
  expect(body.idempotency_key).toMatch(/^[a-f0-9-]{36}$/);
  expect(sessionStorage.length).toBe(0);
});
it("retries an ambiguous failure using exactly the same payload and key", async () => {
  let submissions = 0;
  request.mockImplementation(async path => {
    if (path === "/api/cart") return cart;
    if (path === "/api/shipping") return options;
    if (path === "/api/checkout/quote") return quote;
    if (++submissions === 1) throw new ApiError("Temporary outage", 503);
    return { reference: "a".repeat(24) };
  });
  render(<CheckoutPage />); await review();
  fireEvent.click(screen.getByRole("button", { name: /place order/i }));
  fireEvent.click(await screen.findByRole("button", { name: "Retry the same order" }));
  await waitFor(() => expect(push).toHaveBeenCalled());
  const calls = request.mock.calls.filter(call => call[0] === "/api/checkout");
  expect(calls[0][2]).toEqual(calls[1][2]);
});
it("recovers a completed attempt before allowing a second checkout", async () => {
  const key = "b".repeat(32); sessionStorage.setItem("autoparts-checkout-attempt", key);
  render(<CheckoutPage />);
  await waitFor(() => expect(replace).toHaveBeenCalledWith(`/orders/${"a".repeat(24)}`));
  expect(request).toHaveBeenCalledWith(`/api/checkout/attempt/${key}`);
  expect(request).not.toHaveBeenCalledWith("/api/cart");
});
it("displays immutable order totals and cancels a pending order", async () => {
  const order = { ...quote, reference: "a".repeat(24), status: "pending", payment: { method: "cod", status: "pending_collection" }, address: { name: "Test", line1: "Test street", city: "Test city", country: "PK" }, items: [{ name: "Brake pad", sku: "PAD", quantity: 1, line_total: "1000.00" }], expires_at: new Date().toISOString(), history: [] };
  request.mockResolvedValueOnce(order).mockResolvedValue({ ...order, status: "cancelled", payment: { ...order.payment, status: "cancelled" } });
  render(<OrderPage reference={order.reference} />);
  fireEvent.click(await screen.findByRole("button", { name: "Cancel pending order" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Cancel pending order" })).not.toBeInTheDocument());
  expect(request).toHaveBeenCalledWith(`/api/orders/${order.reference}/cancel`, "POST", {});
});
