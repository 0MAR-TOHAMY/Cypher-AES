import { decode } from "fast-png";
import { randomBytes, toHex } from "./keys";
import { encryptBytes, decryptBytes, type AesMode } from "../amr/modes";
import {
  packPixelRows,
  readImagePixels,
  unpackPixelRows,
  restoreImage,
} from "../abdallah/image-io";
import {
  createImagePayload,
  readImageDescription,
  encodeCipherPngRows,
  decodeCipherPngRows,
} from "../karim/cipher-png";

type Pixels = { width: number; height: number; rgba: Uint8Array };

export const encryptManual = async (
  file: File,
  key: Uint8Array,
  mode: AesMode,
  parameter?: Uint8Array,
) => encryptPixels(await readImagePixels(file), key, mode, parameter);

export function encryptPixels(
  source: Pixels,
  key: Uint8Array,
  mode: AesMode,
  parameter?: Uint8Array,
) {
  const rows = packPixelRows(source.rgba, source.width, source.height);
  const iv = mode === "ECB" ? new Uint8Array() : (parameter ?? randomBytes(16));
  const blocks =
    (rows.bytes.length + Math.ceil(32 / rows.rowBytes) * rows.rowBytes) / 16;
  if (mode === "CTR" && BigInt(`0x${toHex(iv)}`) + BigInt(blocks) > 1n << 128n)
    throw new Error("Initial Counter قريب من الحد الأقصى.");
  const { payload, footerRows } = createImagePayload(
    rows.bytes,
    source.width,
    source.height,
    rows.pixelChannels,
    rows.rowBytes,
  );
  const ciphertext = encryptBytes(mode, key, payload, iv, true);
  return {
    png: encodeCipherPngRows(
      ciphertext,
      rows.rowBytes,
      source.height + footerRows,
    ).png,
    iv,
  };
}

export const decryptManual = async (
  file: File,
  key: Uint8Array,
  mode: AesMode,
  iv?: Uint8Array,
) => decryptCipherPng(new Uint8Array(await file.arrayBuffer()), key, mode, iv);

export function decryptCipherPng(
  png: Uint8Array,
  key: Uint8Array,
  mode: AesMode,
  iv?: Uint8Array,
) {
  if (mode !== "ECB" && !iv)
    throw new Error("أدخل نفس IV / Initial Counter المستخدم في التشفير.");
  const image = decode(png, { checkCrc: true });
  if (image.width * image.height > 30_000_000)
    throw new Error("الصورة كبيرة جدًا.");
  const rowBytes = Math.floor((image.width * 3) / 16) * 16;
  if (rowBytes < 16) throw new Error("الصورة ليست من التنسيق الحالي.");
  const ciphertext = decodeCipherPngRows(
    png,
    image.width,
    image.height,
    rowBytes,
  );
  const plain = decryptBytes(
    mode,
    key,
    ciphertext,
    iv ?? new Uint8Array(),
    true,
  );
  const { width, height, channels } = readImageDescription(
    plain,
    rowBytes,
    image.height,
  );
  return restoreImage(
    width,
    height,
    unpackPixelRows(
      plain.subarray(0, rowBytes * height),
      width,
      height,
      channels,
      rowBytes,
    ),
  );
}
