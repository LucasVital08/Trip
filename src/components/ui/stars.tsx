import { Icon } from "./icon";

/** Nota com estrelas: ★ 4,8 (36) */
export function Stars({
  rating,
  count,
  size = 15,
  showCount = true,
  className = "",
}: {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  if (!count) {
    return (
      <span className={`text-sm text-ink/55 ${className}`}>Novo na estrada</span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon
        name="star"
        size={size}
        className="fill-amber-deep text-amber-deep"
      />
      <span className="text-sm font-semibold tabular-nums">
        {rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      {showCount && (
        <span className="text-sm text-ink/50 tabular-nums">({count})</span>
      )}
    </span>
  );
}
