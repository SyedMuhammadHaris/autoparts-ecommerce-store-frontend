import { z } from "zod";
import type { Field, Resource } from "./resources";

function fieldSchema(field: Field): z.ZodType {
  if (field.key === "window_days") return z.string().refine(value => value === "" || /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3650, "Enter a return window from 1 to 3650 days, or leave blank while disabled.").transform(value => value === "" ? null : Number(value));
  if (field.type === "checkbox") return z.boolean();
  if (field.type === "multiple") return z.array(z.string().regex(/^[1-9][0-9]*$/)).max(16).transform(values => values.map(Number));
  if (field.source) return z.string().refine(value => field.optional && value === "" || /^[1-9][0-9]*$/.test(value), "Choose a record.").transform(value => value ? Number(value) : null);
  if (field.choices) return z.string().refine(value => field.choices!.some(choice => choice.value === value), "Choose a valid option.");
  if (["number", "year"].includes(field.type ?? "")) return z.string().regex(/^\d+$/, "Enter a whole number.").transform(Number).refine(value => Number.isSafeInteger(value) && (field.type === "year" ? value >= 1900 && value <= 2100 : value >= 0 && value <= 2147483647), "Number is outside the supported range.").refine(value => field.key !== "reservation_minutes" || value >= 5 && value <= 1440, "Use a reservation between 5 and 1440 minutes.");
  if (["money", "decimal"].includes(field.type ?? "")) return z.string().refine(value => field.optional && value === "" || (field.type === "money" ? /^\d{1,10}(\.\d{1,2})?$/ : /^\d{1,3}(\.\d{1,3})?$/).test(value), "Enter a valid nonnegative decimal.").refine(value => field.key !== "tax_percent" || value === "" || Number(value) <= 100, "Tax cannot exceed 100%.").transform(value => value === "" ? null : value);
  let text = z.string().trim().max(field.type === "textarea" ? 10000 : field.type === "url" ? 2000 : field.key === "sku" ? 80 : 255);
  if (!field.optional) text = text.min(1, "This field is required.");
  return text.superRefine((value, context) => {
    if (!value) return;
    if (field.type === "url") {
      try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error(); }
      catch { context.addIssue({ code: "custom", message: "Use an HTTP(S) image URL without credentials." }); }
    }
    if (field.key === "slug" && !/^[A-Za-z0-9_-]+$/.test(value)) context.addIssue({ code: "custom", message: "Use letters, digits, hyphens or underscores for the slug." });
  });
}
export function editableFields(resource: Resource, editing: boolean) {
  return resource.fields.filter(field => !editing || !(field.key === "product" || field.immutable));
}
export function resourceSchema(resource: Resource, editing: boolean) {
  const shape = Object.fromEntries(editableFields(resource, editing).map(field => [field.key, fieldSchema(field)]));
  return z.object(shape).superRefine((values, context) => {
    if (resource.key === "return-policies" && values.is_enabled) {
      for (const key of ["window_days", "shipping_refund_policy", "tax_refund_policy"]) if (!values[key]) context.addIssue({ code: "custom", path: [key], message: "Configure this field before enabling returns." });
    }
    if (typeof values.year_start === "number" && typeof values.year_end === "number" && values.year_end < values.year_start) context.addIssue({ code: "custom", path: ["year_end"], message: "The last year must not precede the first year." });
  });
}
export const stockSchema = z.object({ delta: z.string().regex(/^-?\d+$/, "Enter a whole quantity.").transform(Number).refine(value => value !== 0 && Math.abs(value) <= 1000000, "Use a nonzero adjustment between -1000000 and 1000000."), reason: z.string().trim().min(1).max(250) });
export const rolesSchema = z.object({ groups: z.array(z.string().regex(/^[1-9][0-9]*$/)).max(16).transform(values => values.map(Number)) });
