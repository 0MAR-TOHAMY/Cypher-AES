import { readFileSync } from "node:fs";
import { decode } from "fast-png";
import { fromHex, toHex } from "../omar/keys";
import { encryptBytes, decryptBytes } from "./modes";
import {
  deriveKey,
  generateAesKey,
  randomBytes,
  saltFromText,
} from "../omar/keys";
import { parseModeParameter } from "../omar/keys";
import { encryptPixels, decryptCipherPng } from "../omar/manual";
import type { AesMode } from "./modes";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
  if (!ok) failed++;
}
const hex = (s: string) =>
  fromHex(s.replace(/\s+/g, ""), s.replace(/\s+/g, "").length / 2, "test");
const equal = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const key = hex(
  "603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4",
);
const plain =
  hex(`6bc1bee22e409f96e93d7e117393172a ae2d8a571e03ac9c9eb76fac45af8e51
  30c81c46a35ce411e5fbc1191a0a52ef f69f2445df4f9b17ad2b417be66c3710`);
const vectors: { mode: AesMode; iv: string; cipher: string }[] = [
  {
    mode: "ECB",
    iv: "",
    cipher: `f3eed1bdb5d2a03c064b5a7e3db181f8 591ccb10d410ed26dc5ba74a31362870
      b6ed21b99ca6f4f9f153e7b1beafed1d 23304b7a39f9f3ff067d8d8f9e24ecc7`,
  },
  {
    mode: "CBC",
    iv: "000102030405060708090a0b0c0d0e0f",
    cipher: `f58c4c04d6e5f1ba779eabfb5f7bfbd6 9cfc4e967edb808d679f777bc6702c7d
      39f23369a9d9bacfa530e26304231461 b2eb05e2c39be9fcda6c19078c6a9d1b`,
  },
  {
    mode: "CTR",
    iv: "f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff",
    cipher: `601ec313775789a5b7a7f504bbf3d228 f443e3ca4d62b59aca84e990cacaf5c5
      2b0930daa23de94ce87017ba2d84988d dfc9c58db67aada613c2dd08457941a6`,
  },
];
for (const v of vectors) {
  const iv = v.iv ? hex(v.iv) : new Uint8Array();
  const c = encryptBytes(v.mode, key, plain, iv, true);
  check(`NIST ${v.mode} encrypt`, toHex(c) === v.cipher.replace(/\s+/g, ""));
  check(
    `NIST ${v.mode} decrypt`,
    equal(decryptBytes(v.mode, key, c, iv, true), plain),
  );
}

check(
  "CTR counter 85 → 16 bytes",
  toHex(parseModeParameter("CTR", "85")!) ===
    "00000000000000000000000000000055",
);

function rgbaOf(path: string) {
  const img = decode(readFileSync(path));
  const { width, height, channels } = img;
  const src = img.data as Uint8Array;
  if (img.depth !== 8) throw new Error("test expects 8-bit samples");
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++)
      rgba[i * 4 + c] =
        channels >= 3 ? src[i * channels + c] : src[i * channels];
    rgba[i * 4 + 3] =
      channels === 4 || channels === 2 ? src[i * channels + channels - 1] : 255;
  }
  return { width, height, rgba };
}

function synthetic(width: number, height: number, alpha: boolean) {
  const rgba = randomBytes(width * height * 4);
  if (!alpha) for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
  return { width, height, rgba };
}

function repeatedBlocks(bytes: Uint8Array) {
  const seen = new Set<string>();
  let repeats = 0;
  for (let i = 0; i + 16 <= bytes.length; i += 16) {
    const block = toHex(bytes.subarray(i, i + 16));
    if (seen.has(block)) repeats++;
    else seen.add(block);
  }
  return repeats;
}

const images = {
  tux: rgbaOf("public/samples/sample1.png"),
  alice: rgbaOf("public/samples/sample2.png"),
  "1x1 RGB": synthetic(1, 1, false),
  "7x3 RGBA (شفافية)": synthetic(7, 3, true),
  "33x5 RGB": synthetic(33, 5, false),
};

for (const [name, source] of Object.entries(images)) {
  for (const mode of ["ECB", "CBC", "CTR"] as AesMode[]) {
    const k = generateAesKey();
    const { png, iv } = encryptPixels(source, k, mode);
    const recovered = decode(decryptCipherPng(png, k, mode, iv));
    check(
      `${name} ${mode} round-trip`,
      recovered.width === source.width &&
        recovered.height === source.height &&
        equal(recovered.data as Uint8Array, source.rgba),
    );
    if (name === "tux") {
      const cipherPixels = decode(png).data as Uint8Array;
      const r = repeatedBlocks(cipherPixels);
      check(
        `tux ${mode} repeated cipher blocks`,
        mode === "ECB" ? r > 100 : r < 5,
        `${r}`,
      );
    }
    let threw = false;
    try {
      decryptCipherPng(png, generateAesKey(), mode, iv);
    } catch {
      threw = true;
    }
    check(`${name} ${mode} wrong key rejected`, threw);
  }
}

{
  const k = generateAesKey();
  const { png, iv } = encryptPixels(images.tux, k, "CBC");
  let threw = false;
  try {
    decryptCipherPng(png, k, "CTR", iv);
  } catch {
    threw = true;
  }
  check("CBC file decrypted as CTR rejected", threw);
}

async function derivationTests() {
  const k = (phrase: string, salt: string) =>
    deriveKey(phrase, saltFromText(salt), 1000).then(toHex);
  const a = await k("my secret phrase", "a1b2c3d4e5f60718293a4b5c6d7e8f90");
  check("PBKDF2 key is 256-bit", a.length === 64);
  check(
    "same phrase + salt -> same key",
    a === (await k("my secret phrase", "a1b2c3d4e5f60718293a4b5c6d7e8f90")),
  );
  check(
    "different salt -> different key",
    a !== (await k("my secret phrase", "a1b2c3d4e5f60718293a4b5c6d7e8f91")),
  );
  check("short salt accepted", (await k("phrase", "ab")).length === 64);
  check(
    "Arabic text salt accepted",
    (await k("جملة", "ملح عربي")).length === 64,
  );
  let threw = false;
  try {
    saltFromText("");
  } catch {
    threw = true;
  }
  check("empty salt rejected", threw);
}

derivationTests().then(() => {
  console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
  process.exit(failed ? 1 : 0);
});
