import type { Metadata } from "next";
import "@/components/bencho/upstream/label-input/LabelInput.css";
import "@/components/bencho/upstream/upload-dropzone/Upload.css";
import "@/components/bencho/upstream/slide-confirm/SlideConfirm.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "تشفير الصور",
  description: "تشفير الصور وفكها محليًا بأوضاع AES ECB وCBC وCTR",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
