'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { Users, X, UserPlus, UserX, UserCheck } from 'lucide-react';
import { addMember, toggleMemberStatus } from '@/actions/members';
import type { Member } from '@/types/database';

interface ManageMembersModalProps {
  allMembers: Member[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageMembersModal({ allMembers, onClose, onSuccess }: ManageMembersModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
    >
      <div className="relative w-full max-w-md mx-4 bg-[#2C1A10] border border-[#5C3D2E] rounded-md shadow-[0_8px_32px_rgba(202,138,4,0.3)] animate-[slideUp_300ms_ease-out] flex flex-col max-h-[85vh]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3D2517] shrink-0">
          <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] flex items-center gap-2">
            <Users size={18} />
            Kelola Anggota
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#BFA98A] rounded hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[#3D2517] shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-sm font-[Cinzel] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'list' ? 'text-[#CA8A04] border-b-2 border-[#CA8A04]' : 'text-[#BFA98A] hover:text-[#F5E6D3]'
            }`}
          >
            Daftar Anggota
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-[Cinzel] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'add' ? 'text-[#CA8A04] border-b-2 border-[#CA8A04]' : 'text-[#BFA98A] hover:text-[#F5E6D3]'
            }`}
          >
            Tambah Baru
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'list' ? (
            <MembersListTab members={allMembers} onSuccess={onSuccess} />
          ) : (
            <AddMemberTab
              onSuccess={() => {
                onSuccess();
                setActiveTab('list');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MembersListTab({ members, onSuccess }: { members: Member[]; onSuccess: () => void }) {
  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[Cinzel] text-xs font-semibold text-[#F5E6D3] mb-3 uppercase tracking-wider">
          Anggota Aktif ({activeMembers.length})
        </h3>
        <div className="space-y-2">
          {activeMembers.length === 0 ? (
            <p className="text-sm font-[Spectral] text-[#5C3D2E] italic">Belum ada anggota aktif.</p>
          ) : (
            activeMembers.map((m) => (
              <MemberRow key={m.id} member={m} isActive={true} onSuccess={onSuccess} />
            ))
          )}
        </div>
      </div>

      {inactiveMembers.length > 0 && (
        <div>
          <h3 className="font-[Cinzel] text-xs font-semibold text-[#5C3D2E] mb-3 uppercase tracking-wider">
            Nonaktif ({inactiveMembers.length})
          </h3>
          <div className="space-y-2">
            {inactiveMembers.map((m) => (
              <MemberRow key={m.id} member={m} isActive={false} onSuccess={onSuccess} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, isActive, onSuccess }: { member: Member; isActive: boolean; onSuccess: () => void }) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    await toggleMemberStatus(member.id, !isActive);
    setIsPending(false);
    onSuccess();
  }

  return (
    <div className="flex items-center justify-between p-2 rounded bg-[#1A0F0A]/50 border border-[#3D2517]">
      <span className={`font-[Spectral] text-sm ${isActive ? 'text-[#F5E6D3]' : 'text-[#5C3D2E] line-through'}`}>
        {member.name}
      </span>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-[Cinzel] uppercase tracking-wider border rounded transition-all duration-200 disabled:opacity-50 cursor-pointer ${
          isActive
            ? 'text-[#991B1B] border-[#991B1B]/30 hover:bg-[#991B1B]/15'
            : 'text-[#22C55E] border-[#22C55E]/30 hover:bg-[#22C55E]/10'
        }`}
      >
        {isPending ? '...' : isActive ? <><UserX size={12} /> Nonaktif</> : <><UserCheck size={12} /> Aktifkan</>}
      </button>
    </div>
  );
}

function AddMemberTab({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(addMember, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1.5">
          Nama Anggota Baru
        </label>
        <input
          ref={inputRef}
          name="name"
          type="text"
          required
          placeholder="Contoh: Budi"
          className="w-full h-10 px-3 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Spectral] text-sm focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none"
        />
      </div>

      {state?.error && (
        <div className="px-3 py-2 bg-[#991B1B]/15 border border-[#991B1B]/30 rounded font-[Spectral] text-xs text-[#F87171]">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 flex items-center justify-center gap-2 bg-[#CA8A04] text-[#1A0F0A] border border-[#DAA520] rounded font-[Cinzel] text-sm font-bold uppercase tracking-wider hover:bg-[#B8780A] disabled:opacity-35 cursor-pointer"
      >
        {isPending ? 'Menyimpan...' : <><UserPlus size={16} /> Tambah</>}
      </button>
    </form>
  );
}
