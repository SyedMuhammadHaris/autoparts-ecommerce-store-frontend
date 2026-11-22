"use client";
import type { User } from "@/lib/api";
import { RecordForm } from "./record-form";
import { StockForm } from "./stock-form";
import { StaffAccountEditor } from "./staff-account-editor";
import { ReviewModerationForm } from "@/features/reviews/review-moderation-form";
import { permission, type Resource, type Row } from "./resources";

type Props = { resource: Resource; selected: Row | null; choices: Record<string, Row[]>; user: User; canWrite: boolean; loading: boolean; error: unknown; onSaved: () => Promise<void> };
export function AdminResourceEditor({ resource, selected, choices, user, canWrite, loading, error, onSaved }: Props) {
  if (loading) return <p role="status">Loading editor choices…</p>;
  if (error) return <p>Resolve the loading error before editing records.</p>;
  if (!resource.readonly) return <RecordForm resource={resource} selected={selected} choices={choices} canWrite={canWrite} loading={loading} onSaved={onSaved} />;
  if (resource.key === "inventory" && selected) return permission(user, resource.model, "change") ? <StockForm id={selected.id} onSaved={onSaved} /> : <p>You have read access to inventory.</p>;
  if (resource.key === "staff" && selected) return <StaffAccountEditor selected={selected} roles={choices.roles ?? []} onSaved={onSaved} />;
  if (resource.key === "reviews" && selected) {
    if (user.is_superuser || user.permissions.includes("reviews.moderate_review")) return <ReviewModerationForm selected={selected} onSaved={onSaved} />;
    return <><p>{String(selected.title)} · {String(selected.rating)}/5 · {String(selected.status)}</p><p className="content-copy">{String(selected.body)}</p></>;
  }
  return <p>{resource.key === "audit" ? "Audit history is read only." : "Choose a record to manage."}</p>;
}
