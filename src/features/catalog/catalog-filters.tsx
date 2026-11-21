"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VehicleSelector } from "@/components/vehicle-selector";
import { FormErrors } from "@/lib/forms/form-errors";
import type { Taxonomy, VehicleMake, VehicleModel, VehicleFitment } from "@/lib/catalog-types";

const price = z.string().refine(value => !value || /^\d{1,10}(\.\d{1,2})?$/.test(value), "Use a nonnegative price with at most two decimals.");
const schema = z.object({ search: z.string().trim().max(120), category: z.string().max(255), brand: z.string().max(255),
  ordering: z.enum(["-id", "price", "-price", "name"]), min_price: price, max_price: price,
  make: z.string(), model: z.string(), year: z.string(), engine: z.string().max(180), trim: z.string().max(180),
}).superRefine((value, context) => {
  if (value.min_price && value.max_price && Number(value.max_price) < Number(value.min_price)) context.addIssue({ code: "custom", path: ["max_price"], message: "Maximum price must not be less than minimum price." });
});
type Filters = z.infer<typeof schema>;
type Props = { initial: Record<string, string>; categories: Taxonomy[]; brands: Taxonomy[]; makes: VehicleMake[]; models: VehicleModel[]; fitments: VehicleFitment[] };
export function CatalogFilters({ initial, categories, brands, makes, models, fitments }: Props) {
  const router = useRouter();
  const form = useForm<Filters>({ resolver: zodResolver(schema), defaultValues: {
    search: "", category: "", brand: "", ordering: "-id", min_price: "", max_price: "", make: "", model: "", year: "", engine: "", trim: "", ...initial,
  } });
  return <form noValidate className="catalog-filters" action="/products" onSubmit={form.handleSubmit(values => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) query.set(key, value);
    router.push(`/products?${query}`);
  })}>
    <VehicleSelector makes={makes} models={models} fitments={fitments} initial={{ make: initial.make ?? "", model: initial.model ?? "", year: initial.year ?? "", engine: initial.engine ?? "", trim: initial.trim ?? "" }} onSelectionChange={selection => {
      for (const key of ["make", "model", "year", "engine", "trim"] as const) form.setValue(key, selection[key]);
    }} />
    <label>Search<input {...form.register("search")} placeholder="Product name or SKU" maxLength={120} /></label>
    <label>Category<select {...form.register("category")}><option value="">All categories</option>{categories.map(value => <option key={value.id} value={value.slug}>{value.name}</option>)}</select></label>
    <label>Brand<select {...form.register("brand")}><option value="">All brands</option>{brands.map(value => <option key={value.id} value={value.slug}>{value.name}</option>)}</select></label>
    <label>Sort<select {...form.register("ordering")}><option value="-id">Newest</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option><option value="name">Name</option></select></label>
    <label>Minimum price (PKR)<input {...form.register("min_price")} type="number" min="0" step=".01" aria-invalid={!!form.formState.errors.min_price} /></label>
    <label>Maximum price (PKR)<input {...form.register("max_price")} type="number" min="0" step=".01" aria-invalid={!!form.formState.errors.max_price} /></label>
    <FormErrors errors={form.formState.errors} /><button className="primary-button">Find parts</button><Link href="/products">Clear filters</Link>
  </form>;
}
