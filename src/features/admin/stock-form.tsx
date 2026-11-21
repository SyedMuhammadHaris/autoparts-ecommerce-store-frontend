"use client";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiAction, friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";
import { stockSchema } from "./schemas";

export function StockForm({ id, onSaved }: { id: number; onSaved: () => Promise<void> }) {
  const form = useForm<z.input<typeof stockSchema>, unknown, z.output<typeof stockSchema>>({ resolver: zodResolver(stockSchema), defaultValues: { delta: "", reason: "" } });
  const operation = useRef({ fingerprint: "", key: "" });
  const save = useMutation({ retry: false, mutationFn: (values: z.output<typeof stockSchema>) => {
    const fingerprint = JSON.stringify(values);
    if (fingerprint !== operation.current.fingerprint) operation.current = { fingerprint, key: crypto.randomUUID() };
    return apiAction({ path: "/api/admin/inventory/{id}/adjust", pathParams: { id }, method: "POST", payload: { ...values, operation_key: operation.current.key }, notifications: { success: "Stock adjustment recorded." } });
  }, onSuccess: onSaved });
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <p>Positive quantities add stock; negative quantities remove stock. Every adjustment is recorded.</p>
    <label>Quantity change<input {...form.register("delta")} type="number" aria-invalid={!!form.formState.errors.delta} disabled={save.isPending} /></label>
    <label>Reason<input {...form.register("reason")} maxLength={250} aria-invalid={!!form.formState.errors.reason} disabled={save.isPending} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert" className="form-error">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Record adjustment</button>
  </form>;
}
