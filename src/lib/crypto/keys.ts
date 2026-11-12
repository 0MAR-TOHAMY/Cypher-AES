import { randomBytes as nobleRandomBytes } from "@noble/ciphers/utils.js";

const encoder = new TextEncoder();

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

// توليد Key وIV وCounter من نفس مكتبة التشفير (@noble/ciphers)،
// وهي تعتمد على مولد آمن CSPRNG وليس Math.random.
export function randomBytes(length: number): Uint8Array {
  return nobleRandomBytes(length);
}

// مفتاح AES-256 عشوائي: 32 byte = 256 bit.
export function generateAesKey(): Uint8Array {
  return randomBytes(32);
}

export function generateSecret(): string {
  return bytesToBase64(randomBytes(32))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// الـSalt أي نص غير فاضي، ويتحول لـbytes بترميز UTF-8.
// PBKDF2 بيقبل أي طول؛ NIST SP 800-132 بيوصي بـ16 byte (128 bit) عشوائية على الأقل.
export function saltFromText(text: string): Uint8Array {
  if (!text) throw new Error("اكتب Salt أولًا (أي نص).");
  return encoder.encode(text);
}

// نفس العبارة وSalt وعدد التكرارات تنتج دائمًا نفس مفتاح AES-256 (32 byte).
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
) {
  if (!passphrase.trim()) throw new Error("اكتب كلمة أو جملة سرية أولًا.");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: arrayBuffer(salt), iterations },
    baseKey,
    256,
  );
  return new Uint8Array(bits);
}
