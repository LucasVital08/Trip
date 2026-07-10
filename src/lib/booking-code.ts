import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L

/** Código curto legível de reserva, ex.: TRP-8F3K2A */
export function generateBookingCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `TRP-${out}`;
}

/** Token opaco para o link público de acompanhamento da viagem. */
export function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}
