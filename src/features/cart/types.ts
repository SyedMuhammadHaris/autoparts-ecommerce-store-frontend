export type CartItem = {
  variant: number; name: string; slug: string; sku: string; quantity: number;
  unit_price: string; line_total: string; quantity_available: number; available: boolean;
};
export type Cart = { items: CartItem[]; revision: number; currency: "PKR"; subtotal: string; item_count: number };
export function cartChanged() { window.dispatchEvent(new Event("cart-changed")); }
