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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#333333]/40 backdrop-blur-sm animate-fade-in p-4"
    >
      <div className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-slide-up flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-[#333333] flex items-center gap-2">
            <Users className="text-[#008B8B]" size={20} />
            Kelola Anggota
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] rounded-full hover:bg-[#F3F4F6] hover:text-[#333333] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-[#E5E7EB] shrink-0 px-4 mt-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'list' ? 'text-[#008B8B]' : 'text-[#6B7280] hover:text-[#333333]'
            }`}
          >
            Daftar Anggota
            {activeTab === 'list' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#008B8B] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'add' ? 'text-[#008B8B]' : 'text-[#6B7280] hover:text-[#333333]'
            }`}
          >
            Tambah Baru
            {activeTab === 'add' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#008B8B] rounded-t-full" />
            )}
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
        <h3 className="text-xs font-bold text-[#6B7280] mb-3 uppercase tracking-wider">
          Anggota Aktif ({activeMembers.length})
        </h3>
        <div className="space-y-2">
          {activeMembers.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] italic">Belum ada anggota aktif.</p>
          ) : (
            activeMembers.map((m) => (
              <MemberRow key={m.id} member={m} isActive={true} onSuccess={onSuccess} />
            ))
          )}
        </div>
      </div>

      {inactiveMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#9CA3AF] mb-3 uppercase tracking-wider">
            Nonaktif ({inactiveMembers.length})
          </h3>
          <div className="space-y-2 opacity-75">
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
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
      <span className={`text-sm font-medium ${isActive ? 'text-[#333333]' : 'text-[#9CA3AF] line-through'}`}>
        {member.name}
      </span>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 disabled:opacity-50 cursor-pointer ${
          isActive
            ? 'text-[#EF4444] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
            : 'text-[#10B981] bg-[#ECFDF5] hover:bg-[#D1FAE5]'
        }`}
      >
        {isPending ? '...' : isActive ? <><UserX size={14} /> Nonaktif</> : <><UserCheck size={14} /> Aktifkan</>}
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
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#333333] mb-1.5">
          Nama Anggota Baru
        </label>
        <input
          ref={inputRef}
          name="name"
          type="text"
          required
          placeholder="Contoh: Budi"
          className="w-full h-11 px-4 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-xl text-sm focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none placeholder:text-[#9CA3AF]"
        />
      </div>

      {state?.error && (
        <div className="px-4 py-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-sm text-[#EF4444]">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 bg-[#008B8B] text-[#FFFFFF] rounded-full text-sm font-bold transition-all duration-200 hover:bg-[#007676] hover:shadow-md active:translate-y-px disabled:opacity-50 cursor-pointer"
      >
        {isPending ? 'Menyimpan...' : <><UserPlus size={18} /> Tambah</>}
      </button>
    </form>
  );
}
