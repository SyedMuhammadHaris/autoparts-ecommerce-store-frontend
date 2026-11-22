"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApiMutation } from "@/lib/query/hooks";
import { friendlyError } from "@/lib/api";
import { FormErrors } from "@/lib/forms/form-errors";
import type { OwnReview } from "./types";

const schema = z.object({ display_name: z.string().trim().min(1).max(80), rating: z.string().regex(/^[1-5]$/, "Choose a rating from 1 to 5."), title: z.string().trim().min(1).max(150), body: z.string().trim().min(1).max(4000) });
type Values = z.infer<typeof schema>;

export function ReviewForm({ slug, review }: { slug: string; review: OwnReview | null }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { display_name: review?.display_name ?? "Verified purchaser", rating: String(review?.rating ?? ""), title: review?.title ?? "", body: review?.body ?? "" } });
  const save = useApiMutation<unknown, Values>(values => ({ path: "/api/reviews/{slug}/mine", pathParams: { slug }, method: review ? "PATCH" : "POST", payload: { ...values, rating: Number(values.rating) } }), ["/api/reviews", "/api/admin/reviews"]);
  return <form noValidate className="panel-form" onSubmit={form.handleSubmit(values => save.mutate(values))}>
    <label>Public display name<input {...form.register("display_name")} maxLength={80} /></label>
    <label>Rating<select {...form.register("rating")}><option value="">Choose rating</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
    <label>Review title<input {...form.register("title")} maxLength={150} /></label>
    <label>Your review<textarea {...form.register("body")} maxLength={4000} /></label>
    <p>Your display name and review will be public after moderation. Editing removes the published review until staff reviews it again.</p>
    <FormErrors errors={form.formState.errors} />{save.error && <p role="alert">{friendlyError(save.error)}</p>}
    <button className="primary-button" disabled={save.isPending}>{review ? "Update review for moderation" : "Submit review for moderation"}</button>
  </form>;
}
