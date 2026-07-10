import type { ExperienceTier } from "@prisma/client";
import { TIER_LABEL } from "@/lib/tier";
import { Icon } from "./icon";

const TIER_STYLE: Record<ExperienceTier, string> = {
  ECONOMICO: "bg-ink/6 text-ink/75 border-ink/10",
  CONFORTO: "bg-amber/18 text-amber-deep border-amber/40",
  PREMIUM: "bg-ink text-amber border-ink",
};

export function TierBadge({ tier, className = "" }: { tier: ExperienceTier; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TIER_STYLE[tier]} ${className}`}
    >
      {tier === "PREMIUM" && <Icon name="sparkle" size={12} />}
      {TIER_LABEL[tier]}
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-trust/10 px-2 py-0.5 text-xs font-semibold text-trust ${className}`}
      title="Identidade verificada (documento + selfie)"
    >
      <Icon name="shield" size={12} />
      Verificado
    </span>
  );
}

export function AmenityChip({
  icon,
  label,
  muted = false,
}: {
  icon: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        muted
          ? "border-line bg-sand text-ink/60"
          : "border-line bg-sand-card text-ink/80"
      }`}
    >
      <Icon name={icon} size={13} className="text-amber-deep" />
      {label}
    </span>
  );
}
