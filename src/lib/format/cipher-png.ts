import { decode, encode } from "fast-png";

const MAX_PIXELS = 30_000_000;

export function encodeRecoveredPng(
  width: number,
  height: number,
  rgba: Uint8Array,
): Uint8Array {
  return new Uint8Array(
    encode({ width, height, channels: 4, depth: 8, data: rgba }),
  );
}

// نحافظ على موضع الصفوف كي تظهر أنماط ECB، ونحفظ كل ciphertext دون قص.
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
  const pngRowBytes = width * 3;
  const pixels = new Uint8Array(pngRowBytes * height);
  for (let y = 0; y < height; y++) {
    pixels.set(
      ciphertext.subarray(y * rowBytes, (y + 1) * rowBytes),
      y * pngRowBytes,
    );
  }
  return {
    png: new Uint8Array(
      encode({ width, height, channels: 3, depth: 8, data: pixels }),
    ),
    width,
    height,
  };
}

// نقرأ bytes مباشرة من PNG بدل Canvas حتى لا تتغير القيم المشفرة.
export function decodeCipherPngRows(
  png: Uint8Array,
  width: number,
  height: number,
  rowBytes: number,
): Uint8Array {
  const image = decode(png, { checkCrc: true });
  if (
    image.width !== width ||
    image.height !== height ||
    image.channels !== 3 ||
    image.depth !== 8 ||
    width !== Math.ceil(rowBytes / 3)
  ) {
    throw new Error("أبعاد أو صيغة الصورة المشفرة لا تطابق ملف البيانات.");
  }
  const pngRowBytes = width * 3;
  const ciphertext = new Uint8Array(rowBytes * height);
  const pixels = new Uint8Array(image.data);
  for (let y = 0; y < height; y++) {
    if (
      pixels
        .subarray(y * pngRowBytes + rowBytes, (y + 1) * pngRowBytes)
        .some((value) => value !== 0)
    ) {
      throw new Error("الصورة المشفرة تغيّرت بعد إنشائها.");
    }
    ciphertext.set(
      pixels.subarray(y * pngRowBytes, y * pngRowBytes + rowBytes),
      y * rowBytes,
    );
  }
  return ciphertext;
}
