import {
  createImagePayload,
  readImageDescription,
} from "../format/image-payload";
import { toHex } from "../crypto/encoding";
import { decode } from "fast-png";
import type { AesMode } from "../types";
import { randomBytes } from "../crypto/keys";
import { encryptBytes, decryptBytes } from "../crypto/modes";
import {
  packPixelRows,
  readImagePixels,
  unpackPixelRows,
  restoreImage,
} from "../image/image-io";
import { encodeCipherPngRows, decodeCipherPngRows } from "../format/cipher-png";

export async function encryptManual(
  file: File,
  key: Uint8Array,
  mode: AesMode,
  parameter?: Uint8Array,
) {
  // 1) قراءة الصورة وتجهيز صفوف البكسلات مع حفظ الشفافية عند وجودها.
  const source = await readImagePixels(file);
  const rows = packPixelRows(source.rgba, source.width, source.height);
  // 2) اختيار قيمة البدء ومنع التفاف عداد CTR أثناء معالجة الصورة.
  const iv = mode === "ECB" ? new Uint8Array() : (parameter ?? randomBytes(16));
  if (
    mode === "CTR" &&
    BigInt(`0x${toHex(iv)}`) +
      BigInt(
        (rows.bytes.length + Math.ceil(32 / rows.rowBytes) * rows.rowBytes) /
          16,
      ) >
      1n << 128n
  )
    throw new Error("Initial Counter قريب من الحد الأقصى.");
  // 3) إضافة وصف الصورة ثم تشفير التسلسل كاملًا، دون إعادة بدء الـmode لكل صف.
  const { payload, footerRows } = createImagePayload(
    rows.bytes,
    source.width,
    source.height,
    rows.pixelChannels,
    rows.rowBytes,
  );
  const ciphertext = encryptBytes(mode, key, payload, iv, true);
  // 4) تغليف جميع bytes المشفرة في PNG قابل للعرض والتنزيل والفك.
  const packed = encodeCipherPngRows(
    ciphertext,
    rows.rowBytes,
    source.height + footerRows,
  );
  return {
    png: packed.png,
    iv,
  };
}
export async function decryptManual(
  file: File,
  key: Uint8Array,
  mode: AesMode,
  iv?: Uint8Array,
) {
  if (mode !== "ECB" && !iv)
    throw new Error("أدخل نفس IV / Initial Counter المستخدم في التشفير.");
  // 1) قراءة PNG المشفر واستنتاج طول الصف من أبعاده.
  const png = new Uint8Array(await file.arrayBuffer());
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
  // 2) فك AES بنفس المفتاح والـmode وقيمة البدء التي قدمها المستخدم.
  const plain = decryptBytes(
    mode,
    key,
    ciphertext,
    iv ?? new Uint8Array(),
    true,
  );
  // 3) قراءة وصف الصورة بعد الفك ثم إزالة حشو الصفوف وإعادة بناء الصورة.
  const { width, height, channels } = readImageDescription(
    plain,
    rowBytes,
    image.height,
  );
  const rgba = unpackPixelRows(
    plain.subarray(0, rowBytes * height),
    width,
    height,
    channels,
    rowBytes,
  );
  return restoreImage(width, height, rgba);
}
