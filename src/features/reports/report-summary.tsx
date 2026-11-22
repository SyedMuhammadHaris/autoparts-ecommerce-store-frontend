import { priceLabel } from "@/lib/catalog-types";
import type { DashboardReport } from "./types";

export function ReportSummary({ report }: { report: DashboardReport }) {
  return <>
    <section className="state-panel"><h2>Orders and recorded payments · PKR</h2>
      <p>Orders are grouped by creation date and their current status. Payments use collection/verification dates; refunds use their completion date. These operational totals are not a profit statement.</p>
      <dl className="report-metrics">
        <div><dt>Orders placed</dt><dd>{report.orders_placed}</dd></div>
        <div><dt>Active order value</dt><dd>{priceLabel(report.active_order_value)}</dd></div>
        <div><dt>COD collected</dt><dd>{priceLabel(report.cod_collected)}</dd></div>
        <div><dt>Bank transfers verified</dt><dd>{priceLabel(report.bank_verified)}</dd></div>
        <div><dt>Completed refunds</dt><dd>{priceLabel(report.completed_refunds)}</dd></div>
        <div><dt>Net recorded receipts</dt><dd>{priceLabel(report.net_recorded_receipts)}</dd></div>
      </dl>
      <p>Active order value excludes cancelled and expired orders. Net recorded receipts can be negative when refunds relate to payments recorded outside this range.</p>
      <h3>Current status of orders placed in this range</h3><ul>{report.order_statuses.map(row => <li key={row.status}>{row.status}: {row.count}</li>)}</ul>
    </section>
    <section className="state-panel"><h2>Current low stock</h2><p>{report.low_stock_count} inventory slots at or below {report.low_stock_threshold} available units. This live inventory view is independent of the date range; the first 20 are shown.</p>
      {!report.low_stock.length ? <p>No matching low-stock alerts.</p> : <div className="table-scroll"><table><thead><tr><th scope="col">Part</th><th scope="col">Location</th><th scope="col">On hand</th><th scope="col">Reserved</th><th scope="col">Available</th></tr></thead><tbody>{report.low_stock.map(item => <tr key={item.id}><td>{item.sku} · {item.name}</td><td>{item.location}</td><td>{item.on_hand}</td><td>{item.reserved}</td><td>{item.available}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
