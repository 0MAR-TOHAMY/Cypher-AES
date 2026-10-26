export function fromHex(
  value: string,
  length: number,
  label: string,
): Uint8Array {
  if (!new RegExp(`^[0-9a-fA-F]{${length * 2}}$`).test(value.trim()))
    throw new Error(`${label}: أدخل ${length * 2} رمز Hex.`);
  return Uint8Array.from(value.trim().match(/../g)!, (pair) =>
    parseInt(pair, 16),
  );
}
export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
