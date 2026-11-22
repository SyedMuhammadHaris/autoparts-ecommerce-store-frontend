"use client";
import { RolesForm } from "./roles-form";
import { AccountStatusForm } from "./account-status-form";
import type { Row } from "./resources";

export function StaffAccountEditor({ selected, roles, onSaved }: { selected: Row; roles: Row[]; onSaved: () => Promise<void> }) {
  if (selected.is_superuser) return <p>Superusers are managed separately. This editor cannot change their roles or account status.</p>;
  return <><RolesForm selected={selected} roles={roles} onSaved={onSaved} /><AccountStatusForm id={selected.id} active={!!selected.is_active} kind="staff" /></>;
}
