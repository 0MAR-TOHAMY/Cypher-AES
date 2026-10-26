// وصف الصورة يُشفّر مع البكسلات؛ لا يحتوي المفتاح أو IV أو Salt.
// آخر 32 byte: علامة التنسيق، العرض، الارتفاع، عدد القنوات، ثم مساحة محجوزة.
const FOOTER_SIZE = 32;
const SIGNATURE = "SCE422V3";

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
  const view = new DataView(
    footer.buffer,
    footer.byteOffset,
    footer.byteLength,
  );
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
  const view = new DataView(
    footer.buffer,
    footer.byteOffset,
    footer.byteLength,
  );
  const width = view.getUint32(8),
    height = view.getUint32(12),
    channels = view.getUint8(16);
  // تحقق بنيوي قبل تخصيص الصورة، وليس توثيق سلامة تشفيريًا مثل HMAC.
  if (
    (channels !== 3 && channels !== 4) ||
    width < 1 ||
    height < 1 ||
    width * height > 30_000_000 ||
    Math.ceil((width * channels) / 16) * 16 !== rowBytes ||
    height + Math.ceil(FOOTER_SIZE / rowBytes) !== pngHeight
  )
    throw new Error("بيانات الصورة المسترجعة غير صالحة.");
  return { width, height, channels: channels as 3 | 4 };
}
