import type { KycProvider } from "./types";
import { MockKycProvider } from "./mock";

let instance: KycProvider | null = null;

export function getKycProvider(): KycProvider {
  if (instance) return instance;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_KYC !== "true") {
    throw new Error("KYC mock é proibido em produção. Configure um provedor real ou ALLOW_MOCK_KYC=true explicitamente para uma demo.");
  }
  // Gancho para provedores reais: case "idwall": ... case "datavalid": ...
  instance = new MockKycProvider();
  return instance;
}

export type { KycProvider } from "./types";
