"use client";
import { useEffect, useState } from "react";
import { apiRequest, friendlyError } from "@/lib/api";
import type { Page, VehicleMake, VehicleModel, VehicleFitment } from "@/lib/catalog-types";

type Selection = { make: string; model: string; year: string; engine: string; trim: string };
type Props = { makes: VehicleMake[]; models: VehicleModel[]; fitments: VehicleFitment[]; initial: Selection };
async function options<T>(resource: string, query: URLSearchParams): Promise<T[]> {
  const result: T[] = [];
  for (let page = 1; page <= 100; page++) {
    query.set("page", String(page)); query.set("page_size", "100");
    const data = await apiRequest<Page<T>>(`/api/catalog/${resource}?${query}`);
    result.push(...data.results);
    if (!data.next) return result;
  }
  throw new Error("Vehicle options exceed the initial catalog limit");
}
export function VehicleSelector({ makes, models: initialModels, fitments: initialFitments, initial }: Props) {
  const [selection, setSelection] = useState(initial);
  const [models, setModels] = useState(initialModels);
  const [fitments, setFitments] = useState(initialFitments);
  const [error, setError] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingFitments, setLoadingFitments] = useState(false);
  useEffect(() => {
    if (!selection.make) return;
    let live = true;
    options<VehicleModel>("vehicle-models", new URLSearchParams({ make: selection.make })).then(rows => { if (live) { setModels(rows); setLoadingModels(false); } }).catch(failure => { if (live) { setError(friendlyError(failure)); setLoadingModels(false); } });
    return () => { live = false; };
  }, [selection.make]);
  useEffect(() => {
    if (!selection.make || !selection.model) return;
    let live = true;
    options<VehicleFitment>("vehicle-fitments", new URLSearchParams({ make: selection.make, model: selection.model })).then(rows => { if (live) { setFitments(rows); setLoadingFitments(false); } }).catch(failure => { if (live) { setError(friendlyError(failure)); setLoadingFitments(false); } });
    return () => { live = false; };
  }, [selection.make, selection.model]);
  function choose(field: keyof Selection, value: string) {
    setError("");
    if (field === "make") { setModels([]); setFitments([]); setSelection({ make: value, model: "", year: "", engine: "", trim: "" }); setLoadingModels(!!value); setLoadingFitments(false); }
    else if (field === "model") { setFitments([]); setSelection({ ...selection, model: value, year: "", engine: "", trim: "" }); setLoadingFitments(!!value); }
    else if (field === "year") setSelection({ ...selection, year: value, engine: "", trim: "" });
    else if (field === "engine") setSelection({ ...selection, engine: value, trim: "" });
    else setSelection({ ...selection, [field]: value });
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
    {(loadingModels || loadingFitments) && <p role="status">Loading vehicle options…</p>}{error && <p role="alert" className="form-error">{error} Change the vehicle selection to retry.</p>}
  </fieldset>;
}
