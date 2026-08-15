import type { Metadata } from "next";
import { Cinzel, Spectral } from "next/font/google";
import { AuthHeader } from "@/components/auth/auth-header";
import { checkIsAdmin } from "@/lib/auth";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
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
      className={`${cinzel.variable} ${spectral.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#1A0F0A] text-[#F5E6D3] antialiased">
        {/* ── Header ──────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-[#5C3D2E] bg-[#2C1A10]/95 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
            {/* Logo / App Name */}
            <div className="flex items-center gap-2">
              <span className="text-xl">📒</span>
              <h1 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] tracking-wide">
                Si Catat
              </h1>
            </div>

            {/* Auth: Login button or Admin badge */}
            <AuthHeader isAdmin={isAdmin} />
          </div>
        </header>

        {/* ── Main Content ────────────────────────────── */}
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
          {children}
        </main>

        {/* ── Footer ──────────────────────────────────── */}
        <footer className="border-t border-[#3D2517] py-4 text-center">
          <p className="font-[Spectral] text-xs text-[#5C3D2E]">
            Si Catat &copy; {new Date().getFullYear()} — Kas Kontrakan
          </p>
        </footer>
      </body>
    </html>
  );
}
