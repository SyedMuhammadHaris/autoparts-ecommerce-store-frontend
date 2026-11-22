"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ status: z.enum(["pending", "approved", "rejected", "all"]) });
export function ReviewStatusForm({ onApply }: { onApply: (filters: Record<string, string>) => void }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { status: "pending" } });
  return <form className="panel-form" onSubmit={form.handleSubmit(onApply)}><label>Review status<select {...form.register("status")}><option value="pending">Pending</option><option value="approved">Published</option><option value="rejected">Rejected</option><option value="all">All</option></select></label><button className="secondary-button">Filter reviews</button></form>;
}
