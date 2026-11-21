"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { friendlyError, type User } from "@/lib/api";
import { useApiMutation } from "@/lib/query/hooks";
import { profileSchema } from "@/lib/forms/schemas";
import { FormErrors } from "@/lib/forms/form-errors";

export function ProfileForm({ user, disabled }: { user: User; disabled: boolean }) {
  const form = useForm<{ name: string }>({ resolver: zodResolver(profileSchema), values: { name: user.name ?? "" } });
  const update = useApiMutation<{ user: User }, { name: string }>(payload => ({ path: "/api/account/me", method: "PATCH", payload, notifications: { success: "Your name has been updated." } }), ["/api/account/me"]);
  return <>
    <form noValidate onSubmit={form.handleSubmit(values => update.mutate(values))} className="panel-form">
      <label>Name<input {...form.register("name")} aria-invalid={!!form.formState.errors.name} maxLength={255} /></label>
      <FormErrors errors={form.formState.errors} />
      <button className="primary-button" disabled={update.isPending || disabled}>Save name</button>
    </form>
    {update.error && <p role="alert" className="form-error">{friendlyError(update.error)}</p>}
    {update.isSuccess && <p role="status">Your name has been updated.</p>}
  </>;
}
