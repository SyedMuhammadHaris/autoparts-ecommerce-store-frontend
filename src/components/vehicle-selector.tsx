"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientFetch, friendlyError } from "@/lib/api";
import type { Page, VehicleMake, VehicleModel, VehicleFitment } from "@/lib/catalog-types";

type Selection = { make: string; model: string; year: string; engine: string; trim: string };
type Props = { makes: VehicleMake[]; models: VehicleModel[]; fitments: VehicleFitment[]; initial: Selection; onSelectionChange?: (selection: Selection) => void };
async function options<T>(resource: string, values: Record<string, string>, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 100; page++) {
    const result = await clientFetch<Page<T>>({ path: "/api/catalog/{resource}", pathParams: { resource }, query: { ...values, page, page_size: 100 }, signal });
    rows.push(...result.results);
    if (!result.next) return rows;
  }
  throw new Error("Vehicle options exceed the initial catalog limit");
}
export function VehicleSelector({ makes, models: initialModels, fitments: initialFitments, initial, onSelectionChange }: Props) {
  const [selection, setSelection] = useState(initial);
  const modelQuery = useQuery({ queryKey: ["vehicle-models", selection.make], enabled: !!selection.make,
    queryFn: ({ signal }) => options<VehicleModel>("vehicle-models", { make: selection.make }, signal),
    initialData: selection.make === initial.make ? initialModels : undefined,
  });
  const fitmentQuery = useQuery({ queryKey: ["vehicle-fitments", selection.make, selection.model], enabled: !!selection.make && !!selection.model,
    queryFn: ({ signal }) => options<VehicleFitment>("vehicle-fitments", { make: selection.make, model: selection.model }, signal),
    initialData: selection.make === initial.make && selection.model === initial.model ? initialFitments : undefined,
  });
  const models = selection.make ? modelQuery.data ?? [] : [];
  const fitments = selection.model ? fitmentQuery.data ?? [] : [];
  const loadingModels = modelQuery.isFetching;
  const loadingFitments = fitmentQuery.isFetching;
  const error = modelQuery.error ?? fitmentQuery.error;
  function choose(field: keyof Selection, value: string) {
    let next = { ...selection, [field]: value };
    if (field === "make") next = { make: value, model: "", year: "", engine: "", trim: "" };
    else if (field === "model") next = { ...selection, model: value, year: "", engine: "", trim: "" };
    else if (field === "year") next = { ...selection, year: value, engine: "", trim: "" };
    else if (field === "engine") next = { ...selection, engine: value, trim: "" };
    setSelection(next); onSelectionChange?.(next);
  }
  const years = [...new Set(fitments.flatMap(row => Array.from({ length: row.year_end - row.year_start + 1 }, (_, index) => row.year_start + index)))].sort((a, b) => b - a);
  const inYear = fitments.filter(row => !selection.year || row.year_start <= Number(selection.year) && row.year_end >= Number(selection.year));
  const engines = [...new Set(inYear.map(row => row.engine).filter(Boolean))].sort();
  const trims = [...new Set(inYear.filter(row => !selection.engine || row.engine === selection.engine).map(row => row.trim).filter(Boolean))].sort();
  return <fieldset className="vehicle-selector"><legend>Find parts for your vehicle</legend>
    <p>Choose Make → Model → Year. Confirm engine and trim before ordering. Unknown compatibility is excluded when filtering; universal parts are included.</p>
    <div className="vehicle-fields">
      <label>Vehicle make<select name="make" value={selection.make} onChange={event => choose("make", event.target.value)}><option value="">All makes</option>{makes.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label>Vehicle model<select name="model" value={selection.model} onChange={event => choose("model", event.target.value)} disabled={!selection.make || loadingModels}><option value="">All models</option>{models.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label>Vehicle year<select name="year" value={selection.year} onChange={event => choose("year", event.target.value)} disabled={!selection.model || loadingFitments}><option value="">All years</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
      <label>Engine (optional)<select name="engine" value={selection.engine} onChange={event => choose("engine", event.target.value)} disabled={!selection.model || loadingFitments}><option value="">Any listed engine</option>{engines.map(engine => <option key={engine}>{engine}</option>)}</select></label>
      <label>Trim (optional)<select name="trim" value={selection.trim} onChange={event => choose("trim", event.target.value)} disabled={!selection.model || loadingFitments}><option value="">Any listed trim</option>{trims.map(trim => <option key={trim}>{trim}</option>)}</select></label>
    </div>
    {(loadingModels || loadingFitments) && <p role="status">Loading vehicle options…</p>}{error && <p role="alert" className="form-error">{friendlyError(error)} Change the vehicle selection to retry.</p>}
  </fieldset>;
}
