import { encodeRecoveredPng } from "../karim/cipher-png";

export async function readImagePixels(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("ارفع ملف صورة صالحًا.");
  const bitmap = await createImageBitmap(file, {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  try {
    const { width, height } = bitmap;
    if (width * height > 30_000_000)
      throw new Error("الصورة كبيرة جدًا لهذه النسخة من المشروع.");
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("المتصفح لا يستطيع قراءة الصورة.");
    context.drawImage(bitmap, 0, 0);
    return {
      width,
      height,
      rgba: new Uint8Array(context.getImageData(0, 0, width, height).data),
    };
  } finally {
    bitmap.close();
  }
}

export function restoreImage(width: number, height: number, rgba: Uint8Array) {
  if (rgba.length !== width * height * 4)
    throw new Error("بيانات الصورة المسترجعة غير مكتملة.");
  return encodeRecoveredPng(width, height, rgba);
}

export function packPixelRows(rgba: Uint8Array, width: number, height: number) {
  if (rgba.length !== width * height * 4)
    throw new Error("بيانات الصورة غير مكتملة.");
  const pixelChannels: 3 | 4 = rgba.some((v, i) => i % 4 === 3 && v !== 255)
    ? 4
    : 3;
  const rowBytes = Math.ceil((width * pixelChannels) / 16) * 16;
  const bytes = new Uint8Array(rowBytes * height);
  for (let p = 0; p < width * height; p++)
    bytes.set(
      rgba.subarray(p * 4, p * 4 + pixelChannels),
      Math.floor(p / width) * rowBytes + (p % width) * pixelChannels,
    );
  return { bytes, pixelChannels, rowBytes };
}

export function unpackPixelRows(
  bytes: Uint8Array,
  width: number,
  height: number,
  pixelChannels: 3 | 4,
  rowBytes: number,
) {
  if (bytes.length !== rowBytes * height)
    throw new Error("بيانات الصورة المسترجعة غير مكتملة.");
  const rgba = new Uint8Array(width * height * 4).fill(255);
  for (let y = 0; y < height; y++)
    if (
      bytes
        .subarray(y * rowBytes + width * pixelChannels, (y + 1) * rowBytes)
        .some((v) => v !== 0)
    )
      throw new Error("صفوف الصورة المسترجعة غير صالحة.");
  for (let p = 0; p < width * height; p++) {
    const source =
      Math.floor(p / width) * rowBytes + (p % width) * pixelChannels;
    rgba.set(bytes.subarray(source, source + pixelChannels), p * 4);
  }
  return rgba;
}
