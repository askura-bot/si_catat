'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { UserPlus, Users, UserX, UserCheck, X } from 'lucide-react';
import { addMember, toggleMemberStatus } from '@/actions/members';
import type { Member } from '@/types/database';
import type { MemberIncomeSummary } from '@/types/database';

// ============================================================
// Si Catat — Member Management Components
//
// 1. MemberList: Tabel anggota + total iuran bulan ini
// 2. AddMemberModal: Form tambah anggota (admin only)
// 3. MemberRow: Baris tabel dengan aksi toggle status
//
// Semua mengikuti QuestUI design system.
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

/** Format angka ke Rupiah */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// MemberList: Tabel utama anggota + iuran bulan terpilih
// ============================================================

interface MemberListProps {
  members: MemberIncomeSummary[];
  allMembers: Member[];
  isAdmin: boolean;
}

export function MemberList({ members, allMembers, isAdmin }: MemberListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManage, setShowManage] = useState(false);

  return (
    <div className="bg-[#2C1A10] border border-[#5C3D2E] rounded shadow-[0_2px_8px_rgba(202,138,4,0.2)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3D2517]">
        <h2 className="font-[Cinzel] text-base font-semibold text-[#CA8A04] flex items-center gap-2">
          <Users size={18} />
          Iuran Anggota
        </h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManage(!showManage)}
              className="
                px-3 py-1.5
                text-[#BFA98A] text-xs font-[Cinzel] uppercase tracking-wider
                border border-[#5C3D2E] rounded
                hover:bg-[#3D2517] hover:text-[#F5E6D3]
                transition-all duration-200
                cursor-pointer
              "
            >
              {showManage ? 'Tutup' : 'Kelola'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="
                inline-flex items-center gap-1.5
                px-3 py-1.5
                bg-[#CA8A04] text-[#1A0F0A]
                border border-[#DAA520] rounded
                font-[Cinzel] text-xs font-semibold uppercase tracking-wider
                hover:bg-[#B8780A]
                hover:shadow-[0_0_12px_rgba(202,138,4,0.3)]
                transition-all duration-300
                cursor-pointer
              "
            >
              <UserPlus size={13} />
              Tambah
            </button>
          </div>
        )}
      </div>

      {/* Tabel iuran */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3D2517]">
              <th className="px-4 py-2.5 text-left font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#BFA98A]">
                Nama
              </th>
              <th className="px-4 py-2.5 text-right font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#BFA98A]">
                Total Iuran
              </th>
              {isAdmin && showManage && (
                <th className="px-4 py-2.5 text-center font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#BFA98A] w-24">
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin && showManage ? 3 : 2}
                  className="px-4 py-8 text-center font-[Spectral] text-sm text-[#5C3D2E] italic"
                >
                  Belum ada anggota terdaftar.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <MemberRow
                  key={m.member_id}
                  summary={m}
                  member={allMembers.find((am) => am.id === m.member_id)}
                  isAdmin={isAdmin}
                  showManage={showManage}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manage: tampilkan anggota non-aktif */}
      {isAdmin && showManage && (
        <InactiveMembersList members={allMembers} />
      )}

      {/* Modal Tambah Anggota */}
      {showAddModal && (
        <AddMemberModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

// ============================================================
// MemberRow: Satu baris tabel anggota
// ============================================================

interface MemberRowProps {
  summary: MemberIncomeSummary;
  member?: Member;
  isAdmin: boolean;
  showManage: boolean;
}

function MemberRow({ summary, member, isAdmin, showManage }: MemberRowProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    if (!member) return;
    setIsPending(true);
    await toggleMemberStatus(member.id, false);
    setIsPending(false);
  }

  return (
    <tr className="border-b border-[#3D2517]/50 hover:bg-[#3D2517]/30 transition-colors duration-150">
      <td className="px-4 py-3 font-[Spectral] text-sm text-[#F5E6D3]">
        {summary.member_name}
      </td>
      <td className="px-4 py-3 text-right font-[Fira_Code] text-sm text-[#F5E6D3] tabular-nums">
        {summary.total_amount > 0 ? (
          <span className="text-[#22C55E]">{formatRupiah(summary.total_amount)}</span>
        ) : (
          <span className="text-[#5C3D2E]">Rp 0</span>
        )}
      </td>
      {isAdmin && showManage && (
        <td className="px-4 py-3 text-center">
          <button
            onClick={handleToggle}
            disabled={isPending}
            title="Nonaktifkan anggota"
            className="
              inline-flex items-center gap-1
              px-2 py-1
              text-[11px] font-[Cinzel] uppercase tracking-wider
              text-[#991B1B] border border-[#991B1B]/30 rounded
              hover:bg-[#991B1B]/15
              disabled:opacity-35 disabled:cursor-not-allowed
              transition-all duration-200
              cursor-pointer
            "
          >
            <UserX size={12} />
            {isPending ? '...' : 'Nonaktif'}
          </button>
        </td>
      )}
    </tr>
  );
}

// ============================================================
// InactiveMembersList: Daftar anggota nonaktif (admin mode kelola)
// ============================================================

function InactiveMembersList({ members }: { members: Member[] }) {
  const inactive = members.filter((m) => !m.is_active);

  if (inactive.length === 0) return null;

  return (
    <div className="border-t border-[#3D2517] px-4 py-3">
      <p className="font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#5C3D2E] mb-2">
        Anggota Nonaktif
      </p>
      <div className="space-y-1.5">
        {inactive.map((m) => (
          <InactiveMemberRow key={m.id} member={m} />
        ))}
      </div>
    </div>
  );
}

function InactiveMemberRow({ member }: { member: Member }) {
  const [isPending, setIsPending] = useState(false);

  async function handleReactivate() {
    setIsPending(true);
    await toggleMemberStatus(member.id, true);
    setIsPending(false);
  }

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-[#1A0F0A]/50">
      <span className="font-[Spectral] text-sm text-[#5C3D2E] line-through">
        {member.name}
      </span>
      <button
        onClick={handleReactivate}
        disabled={isPending}
        className="
          inline-flex items-center gap-1
          px-2 py-1
          text-[11px] font-[Cinzel] uppercase tracking-wider
          text-[#22C55E] border border-[#22C55E]/30 rounded
          hover:bg-[#22C55E]/10
          disabled:opacity-35 disabled:cursor-not-allowed
          transition-all duration-200
          cursor-pointer
        "
      >
        <UserCheck size={12} />
        {isPending ? '...' : 'Aktifkan'}
      </button>
    </div>
  );
}

// ============================================================
// AddMemberModal: Form tambah anggota baru
// ============================================================

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(addMember, null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tutup jika berhasil
  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  // Escape to close
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

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
        {/* Aksen gold */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] flex items-center gap-2">
            <UserPlus size={18} />
            Tambah Anggota
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#BFA98A] rounded hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="px-6 pb-6 space-y-4">
          <div>
            <label
              htmlFor="member-name"
              className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1.5"
            >
              Nama Anggota
            </label>
            <input
              ref={inputRef}
              id="member-name"
              name="name"
              type="text"
              required
              placeholder="Contoh: Budi"
              className="
                w-full h-10 px-3
                bg-[#2C1A10] text-[#F5E6D3]
                border border-[#5C3D2E] rounded
                font-[Spectral] text-sm
                placeholder:text-[#5C3D2E]
                focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none
                transition-all duration-200
              "
            />
          </div>

          {/* Error */}
          {state?.error && (
            <div className="px-3 py-2 bg-[#991B1B]/15 border border-[#991B1B]/30 rounded font-[Spectral] text-xs text-[#F87171]">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="
              w-full h-10
              flex items-center justify-center gap-2
              bg-[#CA8A04] text-[#1A0F0A]
              border border-[#DAA520] rounded
              font-[Cinzel] text-sm font-bold uppercase tracking-wider
              hover:bg-[#B8780A] hover:shadow-[0_0_16px_rgba(202,138,4,0.4)]
              disabled:opacity-35 disabled:cursor-not-allowed
              transition-all duration-300
              cursor-pointer
            "
          >
            {isPending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#1A0F0A]/30 border-t-[#1A0F0A] rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Tambah Anggota
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
