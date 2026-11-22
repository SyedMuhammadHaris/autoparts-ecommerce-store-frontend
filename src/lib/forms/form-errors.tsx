"use client";
import { useId } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";

function collectMessages(errors: unknown, path = ""): { field: string; message: string }[] {
  if (!errors || typeof errors !== "object") return [];
  const entries = errors as Record<string, unknown>;
  const own = typeof entries.message === "string" ? [{ field: path, message: entries.message }] : [];
  return own.concat(Object.entries(entries).flatMap(([key, value]) =>
    ["message", "type", "ref", "types"].includes(key) ? [] : collectMessages(value, path ? `${path}.${key}` : key)
  ));
}

export function errorAttributes(errors: FieldErrors, field: string, idPrefix: string) {
  const invalid = collectMessages(errors).some(message => message.field === field);
  return { "aria-invalid": invalid, "aria-describedby": invalid ? `${idPrefix}-${field}-error` : undefined };
}

export function FormErrors<T extends FieldValues>({ errors, idPrefix }: { errors: FieldErrors<T>; idPrefix?: string }) {
  const fallbackId = useId();
  const prefix = idPrefix ?? fallbackId;
  const messages = collectMessages(errors);
  if (!messages.length) return null;
  return <ul className="form-error" role="alert" aria-label="Please correct these fields">{messages.map(value => <li id={`${prefix}-${value.field}-error`} key={value.field}>
    <button className="error-focus" type="button" onClick={event => {
      const field = event.currentTarget.form?.elements.namedItem(value.field);
      if (field instanceof HTMLElement) field.focus();
    }}>{value.message}</button>
  </li>)}</ul>;
}
