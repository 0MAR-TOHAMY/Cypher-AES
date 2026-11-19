import { randomBytes } from "@noble/ciphers/utils.js";
import type { AesMode } from "../amr/modes";

export { randomBytes };

const encoder = new TextEncoder();
const hexBytes = (v: string) =>
  Uint8Array.from(v.match(/../g)!, (h) => parseInt(h, 16));

export const generateAesKey = () => randomBytes(32);

export function fromHex(value: string, length: number, label: string) {
  if (!new RegExp(`^[0-9a-fA-F]{${length * 2}}$`).test(value.trim()))
    throw new Error(`${label}: أدخل ${length * 2} رمز Hex.`);
  return hexBytes(value.trim());
}

export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export function parseModeParameter(mode: AesMode, value: string) {
  const v = value.trim();
  if (mode === "ECB" || !v) return undefined;
  if (mode === "CBC") {
    if (!/^[0-9a-fA-F]{32}$/.test(v))
      throw new Error("CBC IV لازم يكون 32 رمز Hex = 16 byte.");
    return hexBytes(v);
  }
  if (!/^\d+$/.test(v))
    throw new Error("العداد الابتدائي لازم يكون عددًا صحيحًا غير سالب.");
  if (BigInt(v) >= 1n << 128n)
    throw new Error("العداد لازم يكون أقل من 2^128.");
  return hexBytes(BigInt(v).toString(16).padStart(32, "0"));
}

export const generateSecret = () =>
  btoa(String.fromCharCode(...randomBytes(32)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

export function saltFromText(text: string) {
  if (!text) throw new Error("اكتب Salt أولًا (أي نص).");
  return encoder.encode(text);
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
) {
  if (!passphrase.trim()) throw new Error("اكتب كلمة أو جملة سرية أولًا.");
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations },
    base,
    256,
  );
  return new Uint8Array(bits);
}
