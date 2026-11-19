import { cbc, ctr, ecb } from "@noble/ciphers/aes.js";

export type AesMode = "ECB" | "CBC" | "CTR";

const cipher = (
  mode: AesMode,
  key: Uint8Array,
  iv: Uint8Array,
  rowAligned: boolean,
) =>
  mode === "ECB"
    ? ecb(key, { disablePadding: rowAligned })
    : mode === "CBC"
      ? cbc(key, iv, { disablePadding: rowAligned })
      : ctr(key, iv);

export const encryptBytes = (
  mode: AesMode,
  key: Uint8Array,
  data: Uint8Array,
  iv: Uint8Array,
  rowAligned = false,
) => cipher(mode, key, iv, rowAligned).encrypt(data);

export const decryptBytes = (
  mode: AesMode,
  key: Uint8Array,
  data: Uint8Array,
  iv: Uint8Array,
  rowAligned = false,
) => cipher(mode, key, iv, rowAligned).decrypt(data);
