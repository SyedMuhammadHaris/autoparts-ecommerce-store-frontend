"use client";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";
import type { ReturnDetails } from "./types";

const schema = z.object({ reason: z.string().trim().min(1, "Explain why you want to return these parts.").max(1000), quantities: z.array(z.string().regex(/^\d{1,2}$/, "Enter a whole quantity from 0 to 99.")) }).refine(values => values.quantities.some(value => Number(value) > 0), { path: ["quantities"], message: "Choose at least one item to return." });
type Values = z.infer<typeof schema>;

export function ReturnForm({ reference, items }: { reference: string; items: ReturnDetails["items"] }) {
  const form = useForm<Values>({ resolver: zodResolver(schema.superRefine((values, context) => values.quantities.forEach((quantity, index) => {
    if (Number(quantity) > items[index].remaining) context.addIssue({ code: "custom", path: ["quantities", index], message: "Cannot exceed the remaining purchased quantity." });
  }))), defaultValues: { reason: "", quantities: items.map(() => "0") } });
  const attempt = useRef({ body: "", key: "" });
  const submit = useApiMutation<unknown, Values>(values => {
    const payload = { reason: values.reason, items: items.map((item, index) => ({ order_item: item.id, quantity: Number(values.quantities[index]) })).filter(item => item.quantity > 0) };
    const body = JSON.stringify(payload);
    if (attempt.current.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    return { path: "/api/orders/{reference}/returns", pathParams: { reference }, method: "POST", payload: { ...payload, idempotency_key: attempt.current.key } };
  }, ["/api/orders"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => submit.mutate(values))}>
    {items.map((item, index) => <label key={item.id}>Return quantity · {item.name} ({item.remaining} remaining)<input {...form.register(`quantities.${index}`)} inputMode="numeric" min={0} max={item.remaining} type="number" /></label>)}
    <label>Return reason<textarea {...form.register("reason")} maxLength={1000} /></label>
    <FormErrors errors={form.formState.errors} />
    {submit.error && <p role="alert">{friendlyError(submit.error)} Retry the same request or refresh return status before creating another request.</p>}
    <p>Staff will review eligibility. Requesting a return does not issue a refund.</p>
    <button className="primary-button" disabled={submit.isPending}>Request return</button>
  </form>;
}
