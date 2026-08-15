import type { Metadata } from "next";
import { Open_Sans, JetBrains_Mono } from "next/font/google";
import { AuthHeader } from "@/components/auth/auth-header";
import { checkIsAdmin } from "@/lib/auth";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Si Catat — Kas Kontrakan",
  description:
    "Aplikasi pencatatan keuangan internal kontrakan. Transparan, otomatis, dan gratis.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const isAdmin = await checkIsAdmin();

  return (
    <html
      lang="id"
      className={`${openSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-dvh flex flex-col bg-[#FFFFFF] text-[#333333] antialiased">
        {/* ── Header ──────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-[#FFFFFF]/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto max-w-7xl w-full flex items-center justify-between px-6 py-3">
            {/* Logo / App Name */}
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h1 className="font-bold text-[#008B8B] tracking-tight text-lg">
                Si Catat
              </h1>
            </div>

            {/* Auth: Login button or Admin badge */}
            <AuthHeader isAdmin={isAdmin} />
          </div>
        </header>

        {/* ── Main Content ────────────────────────────── */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
          {children}
        </main>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="border-t border-[#E5E7EB] py-6 text-center bg-[#F8F9FA]">
          <p className="text-sm text-[#6B7280]">
            Si Catat &copy; {new Date().getFullYear()} — Kas Kontrakan
          </p>
        </footer>
      </body>
    </html>
  );
}
