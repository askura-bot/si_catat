'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { updateIncome, deleteIncome } from '@/actions/incomes';
import type { Income } from '@/types/database';

interface MemberIncomeHistoryModalProps {
  memberId: string;
  memberName: string;
  incomes: Income[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberIncomeHistoryModal({
  memberId,
  memberName,
  incomes,
  onClose,
  onSuccess,
}: MemberIncomeHistoryModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Filter incomes only for this member
  const memberIncomes = incomes.filter((inc) => inc.member_id === memberId);

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

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
    >
      <div className="relative w-full max-w-lg bg-[#2C1A10] border border-[#5C3D2E] rounded-md shadow-[0_8px_32px_rgba(202,138,4,0.3)] animate-[slideUp_300ms_ease-out] flex flex-col max-h-[85vh]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3D2517] shrink-0">
          <div>
            <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] flex items-center gap-2">
              Riwayat Iuran
            </h2>
            <p className="font-[Spectral] text-sm text-[#F5E6D3] mt-1">
              Anggota: <strong className="text-[#CA8A04]">{memberName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#BFA98A] rounded hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {memberIncomes.length === 0 ? (
            <p className="text-sm font-[Spectral] text-[#5C3D2E] italic text-center py-4">
              Belum ada setoran iuran bulan ini.
            </p>
          ) : (
            memberIncomes.map((inc) => (
              <IncomeRow key={inc.id} income={inc} onSuccess={onSuccess} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function IncomeRow({ income, onSuccess }: { income: Income; onSuccess: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [amount, setAmount] = useState(income.amount.toString());
  const [note, setNote] = useState(income.note || '');
  const [errorMsg, setErrorMsg] = useState('');

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  async function handleSave() {
    setIsPending(true);
    setErrorMsg('');
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Nominal tidak valid.');
      setIsPending(false);
      return;
    }

    const res = await updateIncome(income.id, parsedAmount, note);
    if (!res.success) {
      setErrorMsg(res.error || 'Gagal menyimpan.');
    } else {
      setIsEditing(false);
      onSuccess();
    }
    setIsPending(false);
  }

  async function handleDelete() {
    if (!confirm('Hapus transaksi iuran ini?')) return;
    setIsPending(true);
    const res = await deleteIncome(income.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Gagal menghapus.');
      setIsPending(false);
    } else {
      onSuccess();
    }
  }

  if (isEditing) {
    return (
      <div className="p-3 bg-[#1A0F0A]/50 border border-[#CA8A04]/50 rounded space-y-3 relative">
        <div className="space-y-2">
          <div>
            <label className="block font-[Spectral] text-[11px] text-[#BFA98A] mb-1">Nominal</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-8 px-2 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Spectral] text-sm focus:border-[#CA8A04] focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-[Spectral] text-[11px] text-[#BFA98A] mb-1">Catatan</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kosongkan jika tidak ada"
              className="w-full h-8 px-2 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Spectral] text-sm focus:border-[#CA8A04] focus:outline-none"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="text-xs font-[Spectral] text-[#F87171]">{errorMsg}</div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-[#3D2517]">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-[Cinzel] font-semibold text-[#BFA98A] uppercase hover:text-[#F5E6D3] transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/40 rounded font-[Cinzel] text-xs font-bold uppercase tracking-wider hover:bg-[#22C55E]/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check size={14} /> Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#1A0F0A]/50 border border-[#3D2517] rounded gap-3 group hover:border-[#5C3D2E] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-[Fira_Code] text-sm font-semibold text-[#22C55E] tabular-nums">
          {formatRupiah(income.amount)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs font-[Spectral] text-[#BFA98A]">
          <span>{formatDate(income.date)}</span>
          {income.note && (
            <>
              <span className="text-[#5C3D2E]">•</span>
              <span className="italic truncate">{income.note}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          title="Edit"
          className="p-1.5 text-[#BFA98A] bg-[#2C1A10] border border-[#3D2517] rounded hover:text-[#CA8A04] hover:border-[#CA8A04]/50 transition-colors cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Hapus"
          className="p-1.5 text-[#BFA98A] bg-[#2C1A10] border border-[#3D2517] rounded hover:text-[#F87171] hover:border-[#F87171]/50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
