"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";
import type { BankAccount } from "./types";

const schema = z.object({ bank_account: z.string().regex(/^[1-9][0-9]*$/, "Choose a bank account."), reference: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 /_.-]{0,119}$/, "Enter the bank transaction reference (up to 120 characters).") });
type Values = z.infer<typeof schema>;

export function TransferForm({ reference, banks }: { reference: string; banks: BankAccount[] }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { bank_account: "", reference: "" } });
  const submit = useApiMutation<unknown, Values>(values => ({ path: "/api/orders/{reference}/payment", pathParams: { reference }, method: "POST", payload: { ...values, bank_account: Number(values.bank_account) } }), ["/api/orders"]);
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => submit.mutate(values))}>
    <label>Receiving bank account<select {...form.register("bank_account")} aria-invalid={!!form.formState.errors.bank_account}><option value="">Choose bank account</option>{banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name}</option>)}</select></label>
    <label>Bank transaction reference<input {...form.register("reference")} maxLength={120} aria-invalid={!!form.formState.errors.reference} /></label>
    <FormErrors errors={form.formState.errors} />
    {submit.error && <p role="alert" className="form-error">{friendlyError(submit.error)}</p>}
    <p>Submitting a reference does not confirm payment. Staff will check the bank statement. Proof uploads are not available yet.</p>
    <button className="primary-button" disabled={submit.isPending}>Submit transfer for review</button>
  </form>;
}
