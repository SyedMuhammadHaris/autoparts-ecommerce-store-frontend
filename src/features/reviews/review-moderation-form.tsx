"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiAction, friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";
import type { Row } from "@/features/admin/resources";

const schema = z.object({ status: z.enum(["approved", "rejected"]), note: z.string().trim().min(1).max(500) });
type Values = z.infer<typeof schema>;

export function ReviewModerationForm({ selected, onSaved }: { selected: Row; onSaved: () => Promise<void> }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { status: "rejected", note: "" } });
  const save = useMutation({ retry: false, mutationFn: (values: Values) => apiAction({ path: "/api/admin/reviews/{id}/moderate", pathParams: { id: selected.id }, method: "POST", payload: { ...values, revision: Number(selected.revision) } }), onSuccess: onSaved });
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <p>{String(selected.title)} · {String(selected.rating)}/5 · Revision {String(selected.revision)}</p><p className="content-copy">{String(selected.body)}</p>
    <label>Moderation decision<select {...form.register("status")}><option value="rejected">Reject</option><option value="approved">Publish verified-purchase review</option></select></label>
    <label>Customer-facing moderation note<textarea {...form.register("note")} maxLength={500} /></label>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>Record review moderation</button>
  </form>;
}
