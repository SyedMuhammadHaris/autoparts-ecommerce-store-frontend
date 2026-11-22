export type OrderNotice = { id: number; order_reference: string; subject: string; body: string; created_at: string; read_at: string | null };
export const notificationKinds = [
  ["order.created", "Order placed"], ["order.confirmed", "Order confirmed"], ["order.processing", "Order processing"], ["order.shipped", "Order shipped"], ["order.delivered", "Order delivered"], ["order.completed", "Order completed"], ["order.cancelled", "Order cancelled"], ["order.expired", "Order expired"],
  ["payment.transfer_submitted", "Transfer submitted"], ["payment.transfer_approve", "Transfer verified"], ["payment.transfer_reject", "Transfer rejected"], ["payment.cod_confirmed", "COD confirmed (not collected)"], ["payment.cod_collected", "COD collected"],
  ["return.requested", "Return requested"], ["return.approved", "Return approved"], ["return.rejected", "Return rejected"], ["return.received", "Return inspected"], ["refund.requested", "Refund authorized (not paid)"], ["refund.completed", "Offline refund recorded"], ["refund.cancelled", "Refund authorization cancelled"],
].map(([value, label]) => ({ value, label }));
