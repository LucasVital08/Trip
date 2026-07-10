import { randomBytes } from "crypto";
import type { KycProvider, KycResult, KycSubmission } from "./types";

/**
 * KYC simulado: valida o formato do CPF (dígitos verificadores) e aprova.
 * CPFs com formato inválido são rejeitados — dá para demonstrar os dois
 * caminhos sem credencial externa.
 */
export class MockKycProvider implements KycProvider {
  readonly name = "mock";

  async submit(input: KycSubmission): Promise<KycResult> {
    const providerRef = `mock_kyc_${randomBytes(6).toString("hex")}`;
    const ok = isValidCpf(input.documentNumber) && input.fullName.trim().split(/\s+/).length >= 2;
    return ok
      ? { providerRef, status: "VERIFIED", notes: "Verificação simulada aprovada (dev)." }
      : { providerRef, status: "REJECTED", notes: "CPF inválido ou nome incompleto." };
  }
}

export function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += Number(cpf[i]) * (slice + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
