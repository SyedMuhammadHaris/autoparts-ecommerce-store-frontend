import type { FieldErrors, FieldValues } from "react-hook-form";

function collectMessages(errors: unknown, path = ""): { field: string; message: string }[] {
  if (!errors || typeof errors !== "object") return [];
  const entries = errors as Record<string, unknown>;
  const own = typeof entries.message === "string" ? [{ field: path, message: entries.message }] : [];
  return own.concat(Object.entries(entries).flatMap(([key, value]) =>
    ["message", "type", "ref", "types"].includes(key) ? [] : collectMessages(value, path ? `${path}.${key}` : key)
  ));
}

export function FormErrors<T extends FieldValues>({ errors }: { errors: FieldErrors<T> }) {
  const messages = collectMessages(errors);
  if (!messages.length) return null;
  return <ul className="form-error" role="alert">{messages.map(value => <li key={value.field}>{value.message}</li>)}</ul>;
}
