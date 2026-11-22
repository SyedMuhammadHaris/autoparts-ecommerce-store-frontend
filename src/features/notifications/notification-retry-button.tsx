"use client";
import { useMutation } from "@tanstack/react-query";
import { apiAction, friendlyError } from "@/lib/api";

export function NotificationRetryButton({ id, onSaved }: { id: number; onSaved: () => Promise<void> }) {
  const retry = useMutation({ retry: false, mutationFn: () => apiAction({ path: "/api/admin/notifications/{id}/retry", pathParams: { id }, method: "POST", payload: {} }), onSuccess: onSaved });
  return <div><p>Retry uses the stored recipient and message. Order email must be enabled and SMTP configured; queuing does not guarantee delivery.</p>
    {retry.error && <p role="alert">{friendlyError(retry.error)}</p>}
    <button className="primary-button" disabled={retry.isPending} onClick={() => retry.mutate()}>Queue email retry</button>
  </div>;
}
