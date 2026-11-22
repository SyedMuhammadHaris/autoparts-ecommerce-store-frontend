export type ReportFilters = { start: string; end: string; low_stock: string };
export type DashboardReport = {
  generated_at: string; timezone: string; currency: string; start: string; end: string;
  orders_placed: number; active_order_value: string; cod_collected: string;
  bank_verified: string; completed_refunds: string; net_recorded_receipts: string;
  order_statuses: { status: string; count: number }[];
  low_stock_count: number; low_stock_threshold: number;
  low_stock: { id: number; sku: string; name: string; location: string; on_hand: number; reserved: number; available: number }[];
};
