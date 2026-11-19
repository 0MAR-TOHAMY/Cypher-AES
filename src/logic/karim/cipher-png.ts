import { decode, encode } from "fast-png";

const MAX_PIXELS = 30_000_000;
const FOOTER_SIZE = 32;
const SIGNATURE = "SCE422V3";
const footerView = (footer: Uint8Array) =>
  new DataView(footer.buffer, footer.byteOffset, footer.byteLength);

export const encodeRecoveredPng = (
  width: number,
  height: number,
  rgba: Uint8Array,
) =>
  new Uint8Array(encode({ width, height, channels: 4, depth: 8, data: rgba }));

export function createImagePayload(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: 3 | 4,
  rowBytes: number,
) {
  const footerRows = Math.ceil(FOOTER_SIZE / rowBytes);
  const payload = new Uint8Array(pixels.length + footerRows * rowBytes);
  payload.set(pixels);
  const footer = payload.subarray(payload.length - FOOTER_SIZE);
  footer.set(new TextEncoder().encode(SIGNATURE));
  const view = footerView(footer);
  view.setUint32(8, width);
  view.setUint32(12, height);
  view.setUint8(16, channels);
  return { payload, footerRows };
}

export function readImageDescription(
  plain: Uint8Array,
  rowBytes: number,
  pngHeight: number,
) {
  if (plain.length < FOOTER_SIZE) throw new Error("الصورة غير صالحة.");
  const footer = plain.subarray(plain.length - FOOTER_SIZE);
  if (new TextDecoder().decode(footer.subarray(0, 8)) !== SIGNATURE)
    throw new Error(
      "المفتاح أو وضع التشفير أو الصورة غير صحيحة، أو الصورة من إصدار قديم.",
    );
  const view = footerView(footer);
  const [width, height, channels] = [
    view.getUint32(8),
    view.getUint32(12),
    view.getUint8(16),
  ];
  if (
    (channels !== 3 && channels !== 4) ||
    width < 1 ||
    height < 1 ||
    width * height > MAX_PIXELS ||
    Math.ceil((width * channels) / 16) * 16 !== rowBytes ||
    height + Math.ceil(FOOTER_SIZE / rowBytes) !== pngHeight
  )
    throw new Error("بيانات الصورة المسترجعة غير صالحة.");
  return { width, height, channels: channels as 3 | 4 };
}

export function encodeCipherPngRows(
  ciphertext: Uint8Array,
  rowBytes: number,
  height: number,
) {
  if (ciphertext.length !== rowBytes * height || rowBytes % 16 !== 0)
    throw new Error("محاذاة صفوف التشفير غير صالحة.");
  const width = Math.ceil(rowBytes / 3);
  if (width * height > MAX_PIXELS)
    throw new Error("الصورة كبيرة جدًا لهذه النسخة من المشروع.");
  const pixels = new Uint8Array(width * 3 * height);
  for (let y = 0; y < height; y++)
    pixels.set(
      ciphertext.subarray(y * rowBytes, (y + 1) * rowBytes),
      y * width * 3,
    );
  return {
    png: new Uint8Array(
      encode({ width, height, channels: 3, depth: 8, data: pixels }),
    ),
    width,
    height,
  };
}

export function decodeCipherPngRows(
  png: Uint8Array,
  width: number,
  height: number,
  rowBytes: number,
) {
  const image = decode(png, { checkCrc: true });
  if (
    image.width !== width ||
    image.height !== height ||
    image.channels !== 3 ||
    image.depth !== 8 ||
    width !== Math.ceil(rowBytes / 3)
  )
    throw new Error("أبعاد أو صيغة الصورة المشفرة لا تطابق ملف البيانات.");
  const pngRowBytes = width * 3;
  const pixels = new Uint8Array(image.data);
  const ciphertext = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    if (
      pixels
        .subarray(y * pngRowBytes + rowBytes, (y + 1) * pngRowBytes)
        .some((v) => v !== 0)
    )
      throw new Error("الصورة المشفرة تغيّرت بعد إنشائها.");
    ciphertext.set(
      pixels.subarray(y * pngRowBytes, y * pngRowBytes + rowBytes),
      y * rowBytes,
    );
  }
  return ciphertext;
}
