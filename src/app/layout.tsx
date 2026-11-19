import type { Metadata, Viewport } from "next";
import "@/app/components/bencho/upstream/upload-dropzone/Upload.css";
import "@/app/components/bencho/upstream/slide-confirm/SlideConfirm.css";
import "./globals.css";
import PwaRegister from "@/app/components/PwaRegister";

export const metadata: Metadata = {
  title: "تشفير الصور",
  description: "تشفير الصور وفكها محليًا بأوضاع AES ECB وCBC وCTR",
  applicationName: "AES Image",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // تشغيل كتطبيق على iOS بعد «إضافة إلى الشاشة الرئيسية»
  appleWebApp: {
    capable: true,
    title: "AES Image",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
