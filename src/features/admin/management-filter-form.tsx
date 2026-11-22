"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormErrors } from "@/lib/forms/form-errors";

const schema = z.object({ search: z.string().trim().max(100), action: z.string().trim().max(100), object_type: z.string().trim().max(80), actor: z.string().regex(/^(|[1-9][0-9]*)$/, "Use an actor number."), object_id: z.string().regex(/^(|[1-9][0-9]*)$/, "Use an object number.") });

export function ManagementFilterForm({ audit = false, onApply }: { audit?: boolean; onApply: (filters: Record<string, string>) => void }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { search: "", action: "", object_type: "", actor: "", object_id: "" } });
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(values => onApply(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""))))}>
    {audit ? <><label>Exact audit action<input {...form.register("action")} maxLength={100} /></label><label>Object type<input {...form.register("object_type")} maxLength={80} /></label><label>Actor number<input {...form.register("actor")} inputMode="numeric" /></label><label>Object number<input {...form.register("object_id")} inputMode="numeric" /></label></> : <label>Search name or email<input {...form.register("search")} maxLength={100} /></label>}
    <FormErrors errors={form.formState.errors} /><button className="secondary-button">Apply search filters</button>
  </form>;
}
