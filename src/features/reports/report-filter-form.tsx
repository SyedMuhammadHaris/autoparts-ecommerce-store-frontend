"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormErrors } from "@/lib/forms/form-errors";
import type { ReportFilters } from "./types";

const schema = z.object({ start: z.iso.date(), end: z.iso.date(), low_stock: z.string().regex(/^\d{1,4}$/).refine(value => Number(value) <= 1000, "Threshold cannot exceed 1000.") }).superRefine((values, context) => {
  const days = (Date.parse(values.end) - Date.parse(values.start)) / 86400000;
  if (days < 0 || days > 365) context.addIssue({ code: "custom", path: ["end"], message: "Choose an inclusive UTC range of at most 366 days, with end on or after start." });
});

export function ReportFilterForm({ initial, onApply }: { initial: ReportFilters; onApply: (values: ReportFilters) => void }) {
  const form = useForm<ReportFilters>({ resolver: zodResolver(schema), defaultValues: initial });
  return <form className="panel-form" noValidate onSubmit={form.handleSubmit(onApply)}>
    <label>Start date (UTC)<input {...form.register("start")} type="date" /></label>
    <label>End date (UTC, inclusive)<input {...form.register("end")} type="date" /></label>
    <label>Low-stock threshold<input {...form.register("low_stock")} type="number" min={0} max={1000} /></label>
    <FormErrors errors={form.formState.errors} />
    <button className="primary-button">Apply report filters</button>
  </form>;
}
