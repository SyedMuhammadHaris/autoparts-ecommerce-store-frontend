"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiAction, friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";

const schema = z.object({ is_active: z.boolean(), reason: z.enum(["customer_request", "abuse_review", "security_review", "operational"]) });
type Values = z.infer<typeof schema>;

export function AccountStatusForm({ id, active, kind }: { id: number; active: boolean; kind: "staff" | "customers" }) {
  const client = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { is_active: active, reason: "operational" } });
  const save = useMutation({ retry: false, mutationFn: (payload: Values) => apiAction({ path: "/api/admin/{kind}/{id}/status", pathParams: { kind, id }, method: "POST", payload }), onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ["api"] }), client.invalidateQueries({ queryKey: ["admin-rows"] })]);
  } });
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label><input {...form.register("is_active")} type="checkbox" />Account active</label>
    <label>Status change reason<select {...form.register("reason")}><option value="operational">Operational</option><option value="customer_request">Customer request</option><option value="abuse_review">Abuse review</option><option value="security_review">Security review</option></select></label>
    <p>Disabling immediately revokes existing sessions. Re-enabling requires a new sign-in.</p>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Save account status</button>
  </form>;
}
