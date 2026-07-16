"use client";

import { useFormStatus } from "react-dom";

export const inputCls =
  "w-full rounded-xl border border-line bg-sand-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-amber-deep focus:outline-none focus:ring-2 focus:ring-amber/40";

export const labelCls = "mb-1.5 block text-sm font-semibold text-ink/80";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Enviando…",
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "go" | "dark" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-amber text-ink hover:bg-amber-deep",
    go: "bg-trust text-sand-card hover:bg-trust-deep",
    dark: "bg-ink text-sand-card hover:bg-ink-2",
    ghost: "border border-line bg-transparent text-ink hover:bg-ink/5",
    danger: "border border-red-800/30 bg-transparent text-red-900 hover:bg-red-900/5",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-800/25 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-900">
      {error}
    </p>
  );
}

export function FormSuccess({ show, children }: { show?: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <p role="status" className="rounded-xl border border-trust/25 bg-trust/8 px-3.5 py-2.5 text-sm font-medium text-trust">
      {children}
    </p>
  );
}
