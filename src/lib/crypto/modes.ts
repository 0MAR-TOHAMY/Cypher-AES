import { cbc, ctr, ecb } from "@noble/ciphers/aes.js";
import type { AesMode } from "../types";

// نختار mode من المكتبة؛ rowAligned يعطل padding لأن تجهيز الصورة أكمل الـblocks.
export function encryptBytes(
  mode: AesMode,
  key: Uint8Array,
  data: Uint8Array,
  iv: Uint8Array,
  rowAligned = false,
): Uint8Array {
  if (mode === "ECB")
    return ecb(key, { disablePadding: rowAligned }).encrypt(data);
  if (mode === "CBC")
    return cbc(key, iv, { disablePadding: rowAligned }).encrypt(data);
  return ctr(key, iv).encrypt(data);
}

// CTR يستخدم XOR نفسه في الاتجاهين؛ تفاصيل كل mode تنفذها المكتبة.
export function decryptBytes(
  mode: AesMode,
  key: Uint8Array,
  data: Uint8Array,
  iv: Uint8Array,
  rowAligned = false,
): Uint8Array {
  if (mode === "ECB")
    return ecb(key, { disablePadding: rowAligned }).decrypt(data);
  if (mode === "CBC")
    return cbc(key, iv, { disablePadding: rowAligned }).decrypt(data);
  return ctr(key, iv).decrypt(data);
}
