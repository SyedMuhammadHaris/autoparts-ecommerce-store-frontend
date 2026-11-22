export type ShippingOptions = {
  configured: boolean;
  cities: { id: number; name: string; zone_id: number }[];
  rates: { id: number; name: string; zone_id: number; fee: string }[];
  payment_methods: { id: "cod" | "bank_transfer"; name: string }[];
};
export type Quote = {
  subtotal: string; discount: string; shipping_fee: string; tax: string; tax_percent: string;
  total: string; quote_token: string; reservation_minutes: number; valid_for_seconds: number;
};
export type Address = { name: string; email: string; phone: string; line1: string; line2: string; postal_code: string };
export type CheckoutBody = {
  coupon_code?: string;
  city: number; shipping_rate: number; cart_revision: number; payment_method: string;
  quote_token: string; idempotency_key: string; address: Address;
};
export type Order = {
  coupon_code?: string;
  shipment?: { carrier: string; tracking_reference: string; events: { status: string; created_at: string }[] } | null;
  reference: string; status: string; subtotal: string; discount: string; shipping_fee: string;
  tax: string; tax_percent: string; total: string; currency: string; shipping_method: string;
  created_at: string; expires_at: string; address: Address & { city: string; country: string };
  payment: { method: string; status: string };
  items: { name: string; sku: string; quantity: number; unit_price: string; line_total: string }[];
  history: { status: string; created_at: string }[];
};
