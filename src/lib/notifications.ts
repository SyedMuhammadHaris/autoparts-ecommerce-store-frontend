"use client";
import { toast } from "react-toastify";
import { friendlyError } from "@/lib/api/contracts";

export function notifySuccess(message: string) {
  if (typeof window === "undefined" || !message.trim()) return;
  toast.success(message, { toastId: `success:${message}`, role: "status" });
}
export function notifyError(error: unknown, publicMessage?: string) {
  if (typeof window === "undefined" || error instanceof Error && error.name === "AbortError") return;
  const message = publicMessage ?? friendlyError(error);
  toast.error(message, { toastId: `error:${message}`, autoClose: false, role: "alert" });
}
export function clearNotifications() { toast.dismiss(); toast.clearWaitingQueue(); }
