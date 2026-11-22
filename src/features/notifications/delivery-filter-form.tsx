"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ state: z.enum(["all", "disabled", "pending", "sending", "sent", "failed"]) });
export function DeliveryFilterForm({ onApply }: { onApply: (values: Record<string, string>) => void }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { state: "all" } });
  return <form className="panel-form" onSubmit={form.handleSubmit(onApply)}><label>Email delivery state<select {...form.register("state")}>{["all", "disabled", "pending", "sending", "sent", "failed"].map(value => <option key={value} value={value}>{value}</option>)}</select></label><button className="secondary-button">Filter deliveries</button></form>;
}
