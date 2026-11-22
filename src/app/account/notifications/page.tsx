import type { Metadata } from "next";
import { NotificationScreen } from "@/features/notifications/notification-screen";

export const metadata: Metadata = { title: "Your notifications", robots: { index: false, follow: false } };
export default function Page() { return <NotificationScreen />; }
