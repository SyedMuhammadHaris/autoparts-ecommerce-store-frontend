"use client";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { clearNotifications } from "@/lib/notifications";

export function ToastHost() {
  useEffect(() => {
    window.addEventListener("auth-changed", clearNotifications);
    return () => window.removeEventListener("auth-changed", clearNotifications);
  }, []);
  return <ToastContainer className="app-notifications" position="top-right" autoClose={5000} limit={3}
    pauseOnHover pauseOnFocusLoss closeOnClick={false} newestOnTop
    aria-label="Notifications" role="status" />;
}
