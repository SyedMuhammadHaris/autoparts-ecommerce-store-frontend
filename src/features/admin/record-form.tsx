"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiAction, friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";
import { resourceSchema } from "./schemas";
import { label, type Resource, type Row } from "./resources";

type Props = { resource: Resource; selected: Row | null; choices: Record<string, Row[]>; canWrite: boolean; loading: boolean; onSaved: () => Promise<void> };
export function RecordForm({ resource, selected, choices, canWrite, loading, onSaved }: Props) {
  const defaults = Object.fromEntries(resource.fields.map(field => {
    const value = selected?.[field.key];
    if (field.type === "checkbox") return [field.key, value === undefined ? field.defaultValue ?? (field.key === "is_active" && resource.key !== "products") : Boolean(value)];
    if (field.type === "multiple") return [field.key, ((selected?.values as Row[] | undefined) ?? []).map(item => String(item.id))];
    return [field.key, value !== undefined && value !== null ? String(value) : field.choices?.[0]?.value ?? (field.key === "reservation_minutes" ? "30" : field.type === "number" && !field.optional ? "0" : "")];
  }));
  const form = useForm<Record<string, unknown>>({ resolver: zodResolver(resourceSchema(resource, !!selected)), defaultValues: defaults });
  const save = useMutation({ retry: false, mutationFn: (payload: Record<string, unknown>) => apiAction({
    path: selected ? "/api/admin/{resource}/{id}" : "/api/admin/{resource}", pathParams: { resource: resource.key, ...(selected ? { id: selected.id } : {}) }, method: selected ? "PATCH" : "POST", payload,
  }), onSuccess: onSaved });
  return <form noValidate onSubmit={form.handleSubmit(values => save.mutate(values))} className="panel-form">
    {resource.key === "products" && <p>Creating a product also creates its default variant and zero-stock inventory slot. Publish it with Active when ready.</p>}
    {resource.key === "coupons" && <p>One coupon per order, merchandise before tax only; shipping excluded. Use timestamps such as 2026-12-01T00:00:00+00:00. Pending orders hold usage slots; unpaid cancellation/expiry releases them. Confirmed orders and later refunds retain usage.</p>}
    {["pages", "homepage-sections", "banners"].includes(resource.key) && <p>Content renders as plain text in the fixed storefront design. Draft content remains private. The homepage shows the first 5 active banners and 8 active sections in display order.</p>}
    {resource.key === "store-settings" && <p>Create one settings record. These contact details are public; never enter private credentials.</p>}
    {resource.key === "checkout-policies" && <p>Create one policy only. Leaving tax blank disables checkout. Tax is exclusive and applies to merchandise, excluding shipping. Configure a deliberate reservation duration. Payment verification follows in Phase 4.</p>}
    {resource.key === "return-policies" && <p>Create one policy only. Set the return window after delivery and explicit shipping/tax refund rules before enabling returns. No automatic refund amounts or payouts are calculated.</p>}
    {resource.key === "images" && <p>Save a gallery image link. Selecting Primary replaces the current primary image. Uploads await a storage provider.</p>}
    {resource.key === "product-fitments" && <p>Assign a variant to verified vehicle ranges. An active assignment sets its compatibility to Specific vehicles.</p>}
    {resource.fields.map(field => {
      const disabled = !canWrite || save.isPending || !!selected && (field.key === "product" || !!field.immutable);
      return <label key={field.key}>{field.label}{field.source || field.choices ? <select {...form.register(field.key)} aria-invalid={!!form.formState.errors[field.key]} multiple={field.type === "multiple"} disabled={disabled}>
        {field.type !== "multiple" && !field.choices && <option value="">{field.optional ? "None" : "Choose…"}</option>}
        {field.choices?.map(choice => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
        {(choices[field.source ?? ""] ?? []).filter(row => !(resource.key === "categories" && row.id === selected?.id)).map(row => <option value={row.id} key={row.id}>{label(row)}</option>)}
      </select> : field.type === "textarea" ? <textarea {...form.register(field.key)} aria-invalid={!!form.formState.errors[field.key]} maxLength={field.maxLength ?? 10000} disabled={disabled} /> : <input {...form.register(field.key)} aria-invalid={!!form.formState.errors[field.key]} type={["money", "decimal", "year"].includes(field.type ?? "") ? "number" : field.type === "datetime" ? "text" : field.type ?? "text"} step={field.type === "money" ? ".01" : field.type === "decimal" ? ".001" : undefined} disabled={disabled} />}</label>;
    })}
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert" className="form-error">{friendlyError(save.error)}</p>}
    {canWrite ? <button className="primary-button" disabled={save.isPending || loading}>{save.isPending ? "Saving…" : "Save changes"}</button> : <p>You have read access to this section.</p>}
  </form>;
}
