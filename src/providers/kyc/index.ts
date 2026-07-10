import type { KycProvider } from "./types";
import { MockKycProvider } from "./mock";

let instance: KycProvider | null = null;

export function getKycProvider(): KycProvider {
  if (instance) return instance;
  // Gancho para provedores reais: case "idwall": ... case "datavalid": ...
  instance = new MockKycProvider();
  return instance;
}

export type { KycProvider } from "./types";
