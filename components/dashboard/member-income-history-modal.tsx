'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Check, Pencil, Trash2, History } from 'lucide-react';
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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#333333]/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
    >
      <div className="relative w-full max-w-lg bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-[slideUp_420ms_ease-out] flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB] shrink-0 bg-[#FFFFFF]">
          <div>
            <h2 className="text-xl font-bold text-[#333333] flex items-center gap-2">
              <History className="text-[#008B8B]" size={20} />
              Riwayat Iuran
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Anggota: <strong className="text-[#333333] font-semibold">{memberName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] rounded-full hover:bg-[#F3F4F6] hover:text-[#333333] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 bg-[#F8F9FA]">
          {memberIncomes.length === 0 ? (
            <div className="bg-[#FFFFFF] p-8 rounded-xl border border-[#E5E7EB] text-center">
              <p className="text-sm text-[#9CA3AF] italic">
                Belum ada setoran iuran bulan ini.
              </p>
            </div>
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
      <div className="p-4 bg-[#FFFFFF] border border-[#008B8B] rounded-xl shadow-sm space-y-4 relative">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wider">Nominal</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-9 px-3 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-lg font-mono text-sm focus:border-[#008B8B] focus:ring-1 focus:ring-[#008B8B] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wider">Catatan</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kosongkan jika tidak ada"
              className="w-full h-9 px-3 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-lg text-sm focus:border-[#008B8B] focus:ring-1 focus:ring-[#008B8B] focus:outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="text-xs font-medium text-[#EF4444] bg-[#FEF2F2] p-2 rounded">{errorMsg}</div>
        )}

        <div className="flex gap-2 justify-end pt-3 border-t border-[#E5E7EB]">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="px-4 py-1.5 text-xs font-bold text-[#6B7280] uppercase tracking-wider hover:bg-[#F3F4F6] rounded-full transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#008B8B] text-[#FFFFFF] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#007676] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Check size={14} /> Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-sm gap-4 group hover:border-[#D1D5DB] transition-all">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-base font-bold text-[#10B981] tabular-nums tracking-tight">
          {formatRupiah(income.amount)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280] font-medium">
          <span>{formatDate(income.date)}</span>
          {income.note && (
            <>
              <span className="text-[#D1D5DB]">•</span>
              <span className="italic truncate">{income.note}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          title="Edit"
          className="p-2 text-[#9CA3AF] bg-[#FFFFFF] border border-[#E5E7EB] rounded-full hover:text-[#008B8B] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Hapus"
          className="p-2 text-[#9CA3AF] bg-[#FFFFFF] border border-[#E5E7EB] rounded-full hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
