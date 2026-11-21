"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiAction, friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";
import { rolesSchema } from "./schemas";
import { label, type Row } from "./resources";

export function RolesForm({ selected, roles, onSaved }: { selected: Row; roles: Row[]; onSaved: () => Promise<void> }) {
  const form = useForm<z.input<typeof rolesSchema>, unknown, z.output<typeof rolesSchema>>({ resolver: zodResolver(rolesSchema), defaultValues: { groups: ((selected.groups as number[]) ?? []).map(String) } });
  const save = useMutation({ retry: false, mutationFn: (payload: z.output<typeof rolesSchema>) => apiAction({ path: "/api/admin/staff/{id}/roles", pathParams: { id: selected.id }, method: "POST", payload, notifications: { success: "Staff roles updated." } }), onSuccess: onSaved });
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label>Assigned roles<select {...form.register("groups")} multiple disabled={save.isPending}>{roles.map(role => <option value={role.id} key={role.id}>{label(role)}</option>)}</select></label>
    <p>Clear all roles to remove staff access. Superusers are managed separately.</p><FormErrors errors={form.formState.errors} />
    {save.error && <p role="alert" className="form-error">{friendlyError(save.error)}</p>}<button className="primary-button" disabled={save.isPending}>Save roles</button>
  </form>;
}
