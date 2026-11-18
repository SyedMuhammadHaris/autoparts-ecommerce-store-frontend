"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, friendlyError, type User } from "@/lib/api";
import type { Page } from "@/lib/catalog-types";

type Row = { id: number; [key: string]: unknown };
type Field = { key: string; label: string; type?: string; source?: string; optional?: boolean; immutable?: boolean; choices?: { value: string; label: string }[] };
type Resource = { key: string; label: string; model: string; fields: Field[]; readonly?: boolean };
const active = { key: "is_active", label: "Active", type: "checkbox" };
const resources: Resource[] = [
  { key: "products", label: "Products", model: "catalog.product", fields: [
    { key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, { key: "sku", label: "SKU" },
    { key: "category", label: "Category", source: "categories" }, { key: "brand", label: "Brand", source: "brands", optional: true },
    { key: "base_price", label: "Base price (PKR)", type: "money" }, { key: "description", label: "Description", type: "textarea", optional: true },
    { key: "image_url", label: "Direct product image link", type: "url", optional: true }, active,
  ] },
  { key: "categories", label: "Categories", model: "catalog.category", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, { key: "parent", label: "Parent category", source: "categories", optional: true }, active] },
  { key: "brands", label: "Brands", model: "catalog.brand", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "variants", label: "Variants", model: "catalog.productvariant", fields: [{ key: "product", label: "Product", source: "products" }, { key: "sku", label: "SKU" }, { key: "price", label: "Price (PKR)", type: "money" }, { key: "fitment_status", label: "Vehicle compatibility", choices: [{ value: "unknown", label: "Unknown — not recorded" }, { value: "specific", label: "Specific vehicles — use product fitments" }, { value: "universal", label: "Universal fit" }] }, { key: "value_ids", label: "Options (one value per attribute)", source: "attribute-values", type: "multiple", optional: true }, active] },
  { key: "attributes", label: "Attributes", model: "catalog.attribute", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }] },
  { key: "attribute-values", label: "Attribute values", model: "catalog.attributevalue", fields: [{ key: "attribute", label: "Attribute", source: "attributes" }, { key: "value", label: "Value" }] },
  { key: "images", label: "Image gallery", model: "catalog.productimage", fields: [{ key: "product", label: "Product", source: "products" }, { key: "url", label: "Image link", type: "url" }, { key: "alt_text", label: "Image description", optional: true }, { key: "sort_order", label: "Display order", type: "number" }, { key: "is_primary", label: "Primary image", type: "checkbox" }] },
  { key: "vehicle-makes", label: "Vehicle makes", model: "catalog.vehiclemake", fields: [{ key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "vehicle-models", label: "Vehicle models", model: "catalog.vehiclemodel", fields: [{ key: "make", label: "Vehicle make", source: "vehicle-makes", immutable: true }, { key: "name", label: "Name" }, { key: "slug", label: "URL slug" }, active] },
  { key: "vehicle-fitments", label: "Vehicle year ranges", model: "catalog.vehiclefitment", fields: [{ key: "model", label: "Vehicle model", source: "vehicle-models", immutable: true }, { key: "year_start", label: "First year (inclusive)", type: "year" }, { key: "year_end", label: "Last year (inclusive)", type: "year" }, { key: "engine", label: "Engine / engine code", optional: true }, { key: "trim", label: "Trim", optional: true }, active] },
  { key: "product-fitments", label: "Product fitments", model: "catalog.productfitment", fields: [{ key: "variant", label: "Product variant", source: "variants", immutable: true }, { key: "fitment", label: "Compatible vehicle", source: "vehicle-fitments" }, active] },
  { key: "inventory", label: "Inventory", model: "inventory.inventoryitem", fields: [], readonly: true },
  { key: "staff", label: "Staff roles", model: "accounts.user", fields: [], readonly: true },
  { key: "audit", label: "Audit history", model: "audit.auditevent", fields: [], readonly: true },
];
function permission(user: User, model: string, action: string) {
  const [app, name] = model.split(".");
  return user.is_superuser || user.permissions.includes(`${app}.${action}_${name}`);
}
function label(row: Row): string {
  if (row.vehicle) return `${row.sku} → ${label(row.vehicle as Row)}`;
  if (row.model_name) return `${row.make_name} ${row.model_name} · ${row.year_start}–${row.year_end} · ${row.engine || "Engine unspecified"} · ${row.trim || "Trim unspecified"}`;
  if (row.make_name && row.name) return `${row.make_name} ${row.name}`;
  if (row.attribute_name) return `${row.attribute_name}: ${row.value}`;
  return String(row.name || row.product_name || row.sku || row.email || row.url || row.action || row.id);
}
async function allRows(resource: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let page = 1; ; page++) {
    const result = await apiRequest<Page<Row>>(`/api/admin/${resource}?page_size=100&page=${page}`);
    rows.push(...result.results);
    if (!result.next) return rows;
    if (page >= 100) throw new Error("Too many records for this initial management view.");
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>();
  const [resourceKey, setResourceKey] = useState("products");
  const [rows, setRows] = useState<Row[]>([]);
  const [choices, setChoices] = useState<Record<string, Row[]>>({});
  const [selected, setSelected] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [operationKey, setOperationKey] = useState("");
  const resource = resources.find(item => item.key === resourceKey)!;
  const visible = user?.is_staff ? resources.filter(item => item.key === "staff" ? user.is_superuser : permission(user, item.model, "view")) : [];
  const canWrite = !!user && permission(user, resource.model, selected ? "change" : "add");

  useEffect(() => { let live = true; apiRequest<{ user: User }>("/api/account/me").then(result => { if (live) { setUser(result.user); const first = resources.find(item => item.key === "staff" ? result.user.is_superuser : permission(result.user, item.model, "view")); if (first) setResourceKey(first.key); } }).catch(() => { if (live) setUser(null); }); return () => { live = false; }; }, []);
  useEffect(() => {
    if (!user?.is_staff || !(resource.key === "staff" ? user.is_superuser : permission(user, resource.model, "view"))) return;
    let live = true;
    const sources = [...new Set(resource.fields.flatMap(field => field.source ? [field.source] : []))];
    if (resource.key === "staff") sources.push("roles");
    Promise.all([allRows(resource.key), ...sources.map(allRows)]).then(([records, ...options]) => {
      if (live) { setRows(records); setChoices(Object.fromEntries(sources.map((source, index) => [source, options[index]]))); setLoading(false); }
    }).catch(failure => { if (live) { setError(friendlyError(failure)); setLoading(false); } });
    return () => { live = false; };
  }, [user, resource, revision]);

  function chooseResource(key: string) { setResourceKey(key); setRows([]); setSelected(null); setChoices({}); setError(""); setNotice(""); setLoading(true); }
  function chooseRow(row: Row | null) { setSelected(row); setOperationKey(crypto.randomUUID()); setError(""); setNotice(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, unknown> = {};
    setBusy(true); setError(""); setNotice("");
    try {
      let path = `/api/admin/${resource.key}${selected ? `/${selected.id}` : ""}`;
      let method = selected ? "PATCH" : "POST";
      if (resource.key === "inventory") {
        path += "/adjust"; method = "POST";
        Object.assign(body, { delta: Number(data.get("delta")), reason: data.get("reason"), operation_key: operationKey });
      } else if (resource.key === "staff") {
        path += "/roles"; method = "POST"; body.groups = data.getAll("groups").map(Number);
      } else for (const field of resource.fields) {
        if (selected && (field.key === "product" || field.immutable)) continue;
        const value = data.get(field.key);
        body[field.key] = field.type === "checkbox" ? value === "on" : field.type === "multiple" ? data.getAll(field.key).map(Number) : field.source ? value ? Number(value) : null : ["number", "year"].includes(field.type ?? "") ? Number(value) : value;
      }
      await apiRequest(path, method, body);
      setNotice("Changes saved."); setSelected(null); setRevision(value => value + 1); setLoading(true);
    } catch (failure) { setError(friendlyError(failure)); } finally { setBusy(false); }
  }
  if (user === undefined) return <main id="main-content" className="state-panel"><p role="status">Checking access…</p></main>;
  if (!user?.is_staff) return <main id="main-content" className="state-panel"><h1>Staff access required.</h1><p>Sign in with an authorized staff account.</p><Link href="/login">Sign in</Link></main>;
  return <main id="main-content" className="catalog-page">
    <p className="eyebrow">Store workspace</p><h1>Catalog management.</h1>
    <p>Publish parts, maintain variants and record stock adjustments. Checkout follows in Phase 3.</p>
    <nav className="admin-tabs" aria-label="Management sections">{visible.map(item => <button className="secondary-button" aria-current={resourceKey === item.key ? "page" : undefined} key={item.key} onClick={() => chooseResource(item.key)}>{item.label}</button>)}</nav>
    {error && <p role="alert" className="form-error">{error} <button onClick={() => { setLoading(true); setRevision(value => value + 1); }}>Retry loading</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!visible.length ? <p>No management permissions have been assigned.</p> : <div className="admin-layout">
      <section><h2>{resource.label}</h2>{!resource.readonly && canWrite && <button className="secondary-button" onClick={() => chooseRow(null)}>New record</button>}
        {loading ? <p role="status">Loading records…</p> : rows.length === 0 ? <p>No records yet.</p> : <div className="table-scroll"><table><thead><tr><th scope="col">Record</th><th scope="col">Details</th><th scope="col">Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{label(row)}</td><td>{resource.key === "inventory" ? `${row.quantity_on_hand} on hand / ${row.quantity_reserved} reserved / ${row.quantity_available} available` : resource.key === "audit" ? `${row.object_type} #${row.object_id} · ${row.created_at}` : row.is_active === false ? "Inactive / draft" : row.sku ? String(row.sku) : `#${row.id}`}</td><td>{resource.key !== "audit" && <button className="secondary-button" onClick={() => chooseRow(row)}>{resource.key === "inventory" ? "Adjust" : resource.key === "staff" ? "Roles" : "View / edit"}</button>}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="admin-editor" key={`${resource.key}-${selected?.id ?? "new"}-${revision}`}><h2>{selected ? label(selected) : "New record"}</h2>
        {!resource.readonly ? <form onSubmit={save} className="panel-form">
          {resource.key === "products" && <p>Creating a product also creates its default variant and zero-stock inventory slot. Publish it with Active when ready.</p>}
          {resource.key === "images" && <p>Save a gallery image link. Selecting Primary replaces the current primary image. Storage uploads will be added after a provider is chosen.</p>}
          {resource.key === "product-fitments" && <p>Assign a variant to one or more vehicle year ranges. An active assignment sets its compatibility to Specific vehicles. Deactivate an incorrect assignment; it never becomes universal automatically.</p>}
          {resource.key === "vehicle-fitments" && <p>Record supported years and optional engine/trim details from verified part data. Blank engine or trim means unspecified.</p>}
          {resource.fields.map(field => {
            const value = selected?.[field.key];
            const ids = field.key === "value_ids" ? ((selected?.values as Row[] | undefined) ?? []).map(item => String(item.id)) : undefined;
            return <label key={field.key}>{field.label}{field.source || field.choices ? <select name={field.key} required={!field.optional} multiple={field.type === "multiple"} defaultValue={ids ?? (value ? String(value) : field.choices?.[0]?.value ?? "")} disabled={!canWrite || busy || ((field.key === "product" || field.immutable) && !!selected)}>
              {field.type !== "multiple" && !field.choices && <option value="">{field.optional ? "None" : "Choose…"}</option>}{field.choices?.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}{(choices[field.source ?? ""] ?? []).filter(row => !(resource.key === "categories" && row.id === selected?.id)).map(row => <option key={row.id} value={row.id}>{label(row)}</option>)}
            </select> : field.type === "textarea" ? <textarea name={field.key} defaultValue={String(value ?? "")} maxLength={10000} disabled={!canWrite || busy} /> : <input name={field.key} type={field.type === "money" || field.type === "year" ? "number" : field.type ?? "text"} step={field.type === "money" ? ".01" : undefined} min={field.type === "year" ? 1900 : field.type === "money" || field.type === "number" ? 0 : undefined} max={field.type === "year" ? 2100 : undefined} required={!field.optional && field.type !== "checkbox"} defaultValue={field.type === "checkbox" ? undefined : String(value ?? (field.type === "number" ? 0 : ""))} defaultChecked={field.type === "checkbox" ? value === undefined ? field.key === "is_active" && resource.key !== "products" : Boolean(value) : undefined} disabled={!canWrite || busy} />}</label>;
          })}
          {canWrite ? <button className="primary-button" disabled={busy || loading}>{busy ? "Saving…" : "Save changes"}</button> : <p>You have read access to this section.</p>}
        </form> : resource.key === "inventory" && selected ? permission(user, resource.model, "change") ? <form className="panel-form" onSubmit={save} onChange={() => setOperationKey(crypto.randomUUID())}>
          <p>Positive quantities add stock; negative quantities remove stock. Every adjustment is recorded.</p><label>Quantity change<input name="delta" type="number" min={-1000000} max={1000000} required disabled={busy} /></label><label>Reason<input name="reason" maxLength={250} required disabled={busy} /></label><button className="primary-button" disabled={busy}>Record adjustment</button>
        </form> : <p>You have read access to inventory.</p> : resource.key === "staff" && selected ? <form className="panel-form" onSubmit={save}><label>Assigned roles<select name="groups" multiple defaultValue={((selected.groups as number[]) ?? []).map(String)} disabled={busy}>{(choices.roles ?? []).map(role => <option value={role.id} key={role.id}>{label(role)}</option>)}</select></label><p>Clear all roles to remove staff access. Superusers are managed separately.</p><button className="primary-button" disabled={busy}>Save roles</button></form> : <p>{resource.key === "audit" ? "Audit history is read only." : "Choose a record to manage."}</p>}
      </section>
    </div>}
  </main>;
}
