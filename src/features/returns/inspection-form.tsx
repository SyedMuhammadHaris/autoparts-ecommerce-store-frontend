"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { FormErrors } from "@/lib/forms/form-errors";
import { friendlyError } from "@/lib/api";
import type { ReturnEntry } from "./types";

export function InspectionForm({ entry }: { entry: ReturnEntry }) {
  const schema = z.object({ note: z.string().trim().min(1).max(1000), quantities: z.array(z.string().regex(/^\d{1,2}$/, "Explicitly enter the sellable quantity, including 0.")) }).superRefine((values, context) => values.quantities.forEach((quantity, index) => {
    if (Number(quantity) > entry.items[index].quantity) context.addIssue({ code: "custom", path: ["quantities", index], message: "Cannot exceed returned quantity." });
  }));
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { note: "", quantities: entry.items.map(() => "") } });
  const save = useApiMutation<unknown, Values>(values => ({ path: "/api/admin/returns/{id}", pathParams: { id: entry.id }, method: "POST", payload: { action: "receive", note: values.note, items: entry.items.map((item, index) => ({ return_item: item.id, restock_quantity: Number(values.quantities[index]) })) } }), ["/api/admin/returns", "/api/admin/inventory"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <p>Inspect all returned items before recording receipt. Enter 0 for damaged/non-sellable stock. This action records stock movements once and cannot be edited.</p>
    {entry.items.map((item, index) => <label key={item.id}>Sellable quantity · {item.name} (of {item.quantity})<input {...form.register(`quantities.${index}`)} type="number" min={0} max={item.quantity} /></label>)}
    <label>Customer-facing inspection note<textarea {...form.register("note")} maxLength={1000} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Record inspection and restock</button>
  </form>;
}
