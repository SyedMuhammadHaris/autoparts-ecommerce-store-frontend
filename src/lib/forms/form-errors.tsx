import type { FieldErrors, FieldValues } from "react-hook-form";

export function FormErrors<T extends FieldValues>({ errors }: { errors: FieldErrors<T> }) {
  const messages = Object.entries(errors).flatMap(([field, error]) => typeof error?.message === "string" ? [{ field, message: error.message }] : []);
  if (!messages.length) return null;
  return <ul className="form-error" role="alert">{messages.map(value => <li key={value.field}>{value.message}</li>)}</ul>;
}
