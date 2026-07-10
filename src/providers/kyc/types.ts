/**
 * Interface do provedor de verificação de identidade (KYC).
 * Documento + selfie com prova de vida. Implementações: mock (dev) e,
 * futuramente, um provedor real (Serpro Datavalid, idwall, unico...).
 */
export interface KycSubmission {
  userId: string;
  fullName: string;
  documentNumber: string; // CPF
  documentImageUrl?: string;
  selfieImageUrl?: string;
}

export interface KycResult {
  providerRef: string;
  /** mock aprova sincronamente; provedores reais respondem por webhook */
  status: "PENDING" | "VERIFIED" | "REJECTED";
  notes?: string;
}

export interface KycProvider {
  readonly name: string;
  submit(input: KycSubmission): Promise<KycResult>;
}
