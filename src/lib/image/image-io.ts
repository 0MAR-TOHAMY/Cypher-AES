import { encodeRecoveredPng } from "../format/cipher-png";

// قراءة الصورة في Canvas للحصول على RGBA؛ يُغلق bitmap بعد نسخ البكسلات.
export async function readImagePixels(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("ارفع ملف صورة صالحًا.");
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    if (width * height > 30_000_000)
      throw new Error("الصورة كبيرة جدًا لهذه النسخة من المشروع.");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("المتصفح لا يستطيع قراءة الصورة.");
    context.drawImage(bitmap, 0, 0);
    const rgba = new Uint8Array(context.getImageData(0, 0, width, height).data);
    return { width, height, rgba };
  } finally {
    bitmap.close();
  }
}

export function restoreImage(width: number, height: number, rgba: Uint8Array) {
  if (rgba.length !== width * height * 4)
    throw new Error("بيانات الصورة المسترجعة غير مكتملة.");
  return encodeRecoveredPng(width, height, rgba);
}

// الصور المعتمة تستخدم RGB؛ الصور الشفافة تحتفظ بـRGBA. طول كل صف مضاعف لـ16 byte.
export function packPixelRows(rgba: Uint8Array, width: number, height: number) {
  if (rgba.length !== width * height * 4)
    throw new Error("بيانات الصورة غير مكتملة.");
  let pixelChannels: 3 | 4 = 3;
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index] !== 255) {
      pixelChannels = 4;
      break;
    }
  }
  const sourceRowBytes = width * pixelChannels;
  const rowBytes = Math.ceil(sourceRowBytes / 16) * 16;
  const bytes = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      const target = y * rowBytes + x * pixelChannels;
      bytes.set(rgba.subarray(source, source + pixelChannels), target);
    }
  }
  return { bytes, pixelChannels, rowBytes };
}

// عكس التجهيز: إزالة الأصفار المحجوزة وإعادة alpha=255 عندما كان المصدر RGB.
export function unpackPixelRows(
  bytes: Uint8Array,
  width: number,
  height: number,
  pixelChannels: 3 | 4,
  rowBytes: number,
) {
  if (bytes.length !== rowBytes * height)
    throw new Error("بيانات الصورة المسترجعة غير مكتملة.");
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    if (
      bytes
        .subarray(y * rowBytes + width * pixelChannels, (y + 1) * rowBytes)
        .some((value) => value !== 0)
    ) {
      throw new Error("صفوف الصورة المسترجعة غير صالحة.");
    }
    for (let x = 0; x < width; x++) {
      const source = y * rowBytes + x * pixelChannels;
      const target = (y * width + x) * 4;
      rgba.set(bytes.subarray(source, source + pixelChannels), target);
      if (pixelChannels === 3) rgba[target + 3] = 255;
    }
  }
  return rgba;
}
