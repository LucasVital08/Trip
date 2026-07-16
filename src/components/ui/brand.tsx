import Link from "next/link";
import { BRAND } from "@/config/brand";

/** Assinatura da marca: nome + ponto âmbar. */
export function BrandMark({
  className = "",
  dark = false,
  size = "text-2xl",
}: {
  className?: string;
  /** true quando sobre fundo escuro (ink) */
  dark?: boolean;
  size?: string;
}) {
  return (
    <span
      className={`font-display font-bold tracking-tight ${size} ${dark ? "text-sand-card" : "text-ink"} ${className}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {BRAND.name}
      <span className="text-dot">.</span>
    </span>
  );
}

export function BrandLink(props: { dark?: boolean; size?: string }) {
  return (
    <Link href="/" className="inline-flex items-center gap-1 no-underline" aria-label={`${BRAND.name} — página inicial`}>
      <BrandMark {...props} />
    </Link>
  );
}
