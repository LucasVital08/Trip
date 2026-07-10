/** Valores monetários circulam como inteiros em centavos (BRL). */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** "R$ 85" quando não há centavos, senão "R$ 85,50" — para cards. */
export function formatBRLCompact(cents: number): string {
  if (cents % 100 === 0) {
    return `R$ ${(cents / 100).toLocaleString("pt-BR")}`;
  }
  return formatBRL(cents);
}

export function parseBRLToCents(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
