export function parseModeParameter(
  mode: "ECB" | "CBC" | "CTR",
  value: string,
): Uint8Array | undefined {
  if (mode === "ECB" || !value.trim()) return undefined;
  if (mode === "CBC") {
    if (!/^[0-9a-fA-F]{32}$/.test(value.trim()))
      throw new Error("CBC IV لازم يكون 32 رمز Hex = 16 byte.");
    return Uint8Array.from(value.trim().match(/../g)!, (pair) =>
      parseInt(pair, 16),
    );
  }
  if (!/^\d+$/.test(value.trim()))
    throw new Error("العداد الابتدائي لازم يكون عددًا صحيحًا غير سالب.");
  let counter = BigInt(value.trim());
  if (counter >= 1n << 128n) throw new Error("العداد لازم يكون أقل من 2^128.");
  const bytes = new Uint8Array(16);
  for (let index = 15; index >= 0; index--) {
    bytes[index] = Number(counter & 255n);
    counter >>= 8n;
  }
  return bytes;
}
