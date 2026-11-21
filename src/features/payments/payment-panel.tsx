"use client";
import { useApiQuery } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { TransferForm } from "./transfer-form";
import type { PaymentDetails } from "./types";

export function PaymentPanel({ reference, status }: { reference: string; status: string }) {
  const query = useApiQuery<PaymentDetails>({ path: "/api/orders/{reference}/payment", pathParams: { reference } });
  const payment = query.data;
  const latest = payment?.submissions.at(-1);
  return <section className="state-panel"><h2>Bank transfer</h2>
    {query.error && <p role="alert">{friendlyError(query.error)} <button onClick={() => query.refetch()}>Retry payment details</button></p>}
    {query.isPending && <p role="status">Loading payment instructions…</p>}
    {payment && <>
      {payment.bank_accounts.map(bank => <div key={bank.id}><h3>{bank.name}</h3><p>{bank.bank_name} · {bank.account_title}</p><p>Account: {bank.account_number}{bank.iban && <> · IBAN: {bank.iban}</>}</p><p>{bank.instructions}</p></div>)}
      <ul>{payment.submissions.map(entry => <li key={entry.id}>{entry.reference} · {entry.decision === "approve" ? "Verified" : entry.decision === "reject" ? "Rejected" : "Awaiting review"}{entry.note && <p>{entry.note}</p>}</li>)}</ul>
      {status === "pending" && payment.status === "awaiting_transfer" && (!latest || latest.decision === "reject") && (payment.bank_accounts.length ? <TransferForm reference={reference} banks={payment.bank_accounts} /> : <p>Bank instructions are currently unavailable. Contact the store before transferring funds.</p>)}
      {status === "pending" && <p>The reservation deadline still applies while staff reviews your transfer. Do not send funds after the deadline. Contact the store about a transfer for an expired order.</p>}
    </>}
  </section>;
}
