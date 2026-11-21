import { priceLabel } from "@/lib/catalog-types";

type Amounts = { subtotal: string; discount: string; shipping_fee: string; tax: string; tax_percent: string; total: string };
export function Totals({ amounts }: { amounts: Amounts }) {
  return <dl className="checkout-totals">
    <div><dt>Merchandise</dt><dd>{priceLabel(amounts.subtotal)}</dd></div>
    <div><dt>Discount</dt><dd>{priceLabel(amounts.discount)}</dd></div>
    <div><dt>Shipping</dt><dd>{priceLabel(amounts.shipping_fee)}</dd></div>
    <div><dt>Tax ({amounts.tax_percent}%, merchandise only)</dt><dd>{priceLabel(amounts.tax)}</dd></div>
    <div><dt><strong>Total</strong></dt><dd><strong>{priceLabel(amounts.total)}</strong></dd></div>
  </dl>;
}
