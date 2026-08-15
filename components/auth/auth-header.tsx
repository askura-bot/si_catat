'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Lock, LogOut, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { loginAction, logoutAction } from '@/actions/auth';

// ============================================================
// Si Catat — Login Modal & Admin Badge
// Komponen UI autentikasi untuk header.
// Mengikuti Corporate Radial Process design system.
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
          px-5 py-2.5
          bg-transparent
          text-[#008B8B] 
          border-[1.5px] border-[#008B8B]
          rounded-full
          text-sm font-semibold
          transition-all duration-200
          hover:bg-[#008B8B]/5 active:translate-y-[1px]
          cursor-pointer
        "
      >
        <Lock size={16} />
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
          bg-[#008B8B]/10
          text-[#008B8B]
          border border-[#008B8B]/20
          rounded-full
          text-xs font-semibold
        "
      >
        <ShieldCheck size={14} />
        Mode Admin
      </span>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="
          inline-flex items-center gap-1.5
          px-4 py-2
          bg-transparent
          text-[#333333]
          border-[1.5px] border-[#E5E7EB]
          rounded-full
          text-sm font-medium
          transition-all duration-200
          hover:bg-[#F3F4F6] active:translate-y-[1px]
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        <LogOut size={16} />
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
        bg-[#333333]/40 backdrop-blur-sm
        animate-[fadeIn_200ms_ease-out]
      "
    >
      <div
        className="
          relative w-full max-w-sm mx-4
          bg-[#FFFFFF] border border-[#E5E7EB]
          rounded-[24px]
          shadow-[0_8px_32px_rgba(0,0,0,0.08)]
          animate-[slideUp_420ms_ease-out]
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-[#333333] flex items-center gap-2">
            <Lock className="text-[#008B8B]" size={20} />
            Login Bendahara
          </h2>
          <button
            onClick={onClose}
            className="
              p-1.5 text-[#6B7280] rounded-full
              hover:bg-[#F3F4F6] hover:text-[#333333]
              transition-colors duration-200
              cursor-pointer
            "
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Deskripsi */}
        <p className="px-6 pb-6 text-sm text-[#6B7280]">
          Masukkan password admin untuk mengelola data kas kontrakan.
        </p>

        {/* Form */}
        <form action={formAction} className="px-6 pb-6 space-y-5">
          {/* Input password */}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-[#333333] mb-1.5"
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
                  w-full h-11 px-4 pr-10
                  bg-[#FFFFFF] text-[#333333]
                  border border-[#D1D5DB] rounded-xl
                  text-sm
                  placeholder:text-[#9CA3AF]
                  focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none
                  transition-all duration-200
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-1 text-[#9CA3AF]
                  hover:text-[#6B7280]
                  transition-colors duration-200
                  cursor-pointer
                "
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {state?.error && (
            <div
              className="
                px-4 py-3
                bg-[#FEF2F2]
                border border-[#FCA5A5]
                rounded-xl
                text-sm text-[#EF4444]
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
              w-full h-11
              flex items-center justify-center gap-2
              bg-[#008B8B] text-[#FFFFFF]
              rounded-full
              text-sm font-bold
              transition-all duration-200
              hover:bg-[#007676] hover:shadow-md
              active:translate-y-[1px]
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#FFFFFF]/30 border-t-[#FFFFFF] rounded-full animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
