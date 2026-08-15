'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Lock, LogOut, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { loginAction, logoutAction } from '@/actions/auth';

// ============================================================
// Si Catat — Login Modal & Admin Badge
// Komponen UI autentikasi untuk header.
// Mengikuti QuestUI design system (RPG / medieval theme).
// ============================================================

interface AuthHeaderProps {
  /** Status admin yang diperiksa di server lalu dikirim sebagai prop */
  isAdmin: boolean;
}

export function AuthHeader({ isAdmin }: AuthHeaderProps) {
  if (isAdmin) {
    return <AdminBadge />;
  }
  return <LoginButton />;
}

// ============================================================
// Tombol "Login Bendahara" — membuka modal
// ============================================================
function LoginButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          inline-flex items-center gap-2
          px-4 py-2
          bg-transparent
          text-[#CA8A04] 
          border border-[#CA8A04]
          rounded
          font-[Cinzel] text-xs font-semibold uppercase tracking-wider
          transition-all duration-300
          hover:bg-[#CA8A04]/10 hover:shadow-[0_0_12px_rgba(202,138,4,0.25)]
          cursor-pointer
        "
      >
        <Lock size={14} />
        Login Bendahara
      </button>

      {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

// ============================================================
// Badge "Mode Admin" + Tombol Logout
// ============================================================
function AdminBadge() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    await logoutAction();
    // Force full page refresh to re-render server components
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-3">
      {/* Badge */}
      <span
        className="
          inline-flex items-center gap-1.5
          px-3 py-1.5
          bg-[#CA8A04]/15
          text-[#CA8A04]
          border border-[#CA8A04]/40
          rounded-sm
          font-[Cinzel] text-[11px] font-semibold uppercase tracking-[1px]
        "
      >
        <ShieldCheck size={13} />
        Mode Admin
      </span>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="
          inline-flex items-center gap-1.5
          px-3 py-1.5
          bg-transparent
          text-[#BFA98A]
          border border-[#5C3D2E]
          rounded
          font-[Cinzel] text-[11px] uppercase tracking-wider
          transition-all duration-300
          hover:bg-[#3D2517] hover:text-[#F5E6D3] hover:border-[#CA8A04]/40
          disabled:opacity-35 disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        <LogOut size={13} />
        {isPending ? 'Keluar...' : 'Logout'}
      </button>
    </div>
  );
}

// ============================================================
// Modal Login — Input password dengan Server Action
// ============================================================
function LoginModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-focus input saat modal terbuka
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tutup modal jika login berhasil
  useEffect(() => {
    if (state?.success) {
      // Reload untuk me-refresh server component (header badge)
      window.location.reload();
    }
  }, [state?.success]);

  // Tutup modal jika klik di overlay (luar modal)
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  // Tutup modal dengan Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70 backdrop-blur-sm
        animate-[fadeIn_200ms_ease-out]
      "
    >
      <div
        className="
          relative w-full max-w-sm mx-4
          bg-[#2C1A10] border border-[#5C3D2E]
          rounded-md
          shadow-[0_8px_32px_rgba(202,138,4,0.3)]
          animate-[slideUp_300ms_ease-out]
        "
      >
        {/* Aksen gold di atas */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] flex items-center gap-2">
            <Lock size={18} />
            Login Bendahara
          </h2>
          <button
            onClick={onClose}
            className="
              p-1 text-[#BFA98A] rounded
              hover:bg-[#3D2517] hover:text-[#F5E6D3]
              transition-colors duration-200
              cursor-pointer
            "
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Deskripsi */}
        <p className="px-6 pb-4 font-[Spectral] text-sm text-[#BFA98A]">
          Masukkan password admin untuk mengelola data kas kontrakan.
        </p>

        {/* Form */}
        <form action={formAction} className="px-6 pb-6 space-y-4">
          {/* Input password */}
          <div>
            <label
              htmlFor="admin-password"
              className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Masukkan password..."
                className="
                  w-full h-10 px-3 pr-10
                  bg-[#2C1A10] text-[#F5E6D3]
                  border border-[#5C3D2E] rounded
                  font-[Spectral] text-sm
                  placeholder:text-[#5C3D2E]
                  focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none
                  transition-all duration-200
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  p-1 text-[#5C3D2E]
                  hover:text-[#BFA98A]
                  transition-colors duration-200
                  cursor-pointer
                "
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {state?.error && (
            <div
              className="
                px-3 py-2
                bg-[#991B1B]/15
                border border-[#991B1B]/30
                rounded
                font-[Spectral] text-xs text-[#F87171]
              "
            >
              {state.error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className="
              w-full h-10
              flex items-center justify-center gap-2
              bg-[#CA8A04] text-[#1A0F0A]
              border border-[#DAA520]
              rounded
              font-[Cinzel] text-sm font-bold uppercase tracking-wider
              transition-all duration-300
              hover:bg-[#B8780A]
              hover:shadow-[0_0_16px_rgba(202,138,4,0.4)]
              disabled:opacity-35 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#1A0F0A]/30 border-t-[#1A0F0A] rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
