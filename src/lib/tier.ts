import type { ExperienceTier, VehicleCategory } from "@prisma/client";

/**
 * Derivação automática da faixa de experiência (Econômico/Conforto/Premium).
 *
 * Pontuação = soma dos pesos (tierWeight) dos opcionais oferecidos
 *           + bônus do veículo (idade + categoria).
 *
 *   pontos < 4   → ECONOMICO
 *   4 ≤ p < 9    → CONFORTO
 *   p ≥ 9        → PREMIUM
 *
 * Regra documentada em DECISIONS.md. Os pesos dos opcionais vivem no
 * catálogo (Amenity.tierWeight), então ajustar a régua não exige deploy.
 */

export interface TierInput {
  amenityWeights: number[]; // tierWeight de cada opcional selecionado
  vehicleYear: number;
  vehicleCategory: VehicleCategory;
  currentYear?: number;
}

const CATEGORY_BONUS: Record<VehicleCategory, number> = {
  HATCH: 0,
  SEDAN: 1,
  SUV: 2,
  MINIVAN: 2,
  PICKUP: 2,
};

export function tierScore(input: TierInput): number {
  const now = input.currentYear ?? new Date().getFullYear();
  const amenityScore = input.amenityWeights.reduce((s, w) => s + w, 0);
  const age = Math.max(0, now - input.vehicleYear);
  const ageBonus = age <= 3 ? 2 : age <= 7 ? 1 : 0;
  return amenityScore + ageBonus + CATEGORY_BONUS[input.vehicleCategory];
}

export function deriveTier(input: TierInput): ExperienceTier {
  const score = tierScore(input);
  if (score >= 9) return "PREMIUM";
  if (score >= 4) return "CONFORTO";
  return "ECONOMICO";
}

export const TIER_LABEL: Record<ExperienceTier, string> = {
  ECONOMICO: "Econômico",
  CONFORTO: "Conforto",
  PREMIUM: "Premium",
};
