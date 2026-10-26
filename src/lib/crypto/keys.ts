const encoder = new TextEncoder();

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

// يعتمد التوليد على مولد المتصفح الآمن، وليس Math.random.
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
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
