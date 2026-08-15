'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { CreditCard, Calendar, StickyNote, X } from 'lucide-react';
import { addExpense } from '@/actions/expenses';

interface ExpenseModalProps {
  periodId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatThousands(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ExpenseModal({ periodId, onClose, onSuccess }: ExpenseModalProps) {
  const [state, formAction, isPending] = useActionState(addExpense, null);
  const [amountDisplay, setAmountDisplay] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
      onClose();
    }
  }, [state?.success, onSuccess, onClose]);

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
      <div className="relative w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-[slideUp_420ms_ease-out] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-[#333333] flex items-center gap-2">
            <CreditCard className="text-[#008B8B]" size={20} />
            Catat Pengeluaran
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] rounded-full hover:bg-[#F3F4F6] hover:text-[#333333] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-5">
          <input type="hidden" name="period_id" value={periodId} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5 flex items-center gap-1.5">
                <StickyNote size={16} className="text-[#6B7280]" /> Keterangan
              </label>
              <input
                name="description"
                type="text"
                required
                placeholder="Token listrik, air..."
                className="w-full h-11 px-4 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-xl text-sm focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Nominal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-[#6B7280]">Rp</span>
                <input
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="50.000"
                  value={amountDisplay}
                  onChange={(e) => setAmountDisplay(formatThousands(e.target.value))}
                  className="w-full h-11 pl-10 pr-4 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-xl font-mono text-sm font-semibold focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none placeholder:font-sans placeholder:font-normal placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5 flex items-center gap-1.5">
                <Calendar size={16} className="text-[#6B7280]" /> Tanggal
              </label>
              <input
                name="date"
                type="date"
                defaultValue={todayISO()}
                className="w-full h-11 px-4 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-xl text-sm focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>

          {state?.error && (
            <div className="px-4 py-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-sm text-[#EF4444]">
              {state.error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 flex items-center justify-center gap-2 bg-[#008B8B] text-[#FFFFFF] rounded-full text-sm font-bold transition-all duration-200 hover:bg-[#007676] hover:shadow-md active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
