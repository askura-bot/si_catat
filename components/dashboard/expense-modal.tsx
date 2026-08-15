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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
    >
      <div className="relative w-full max-w-md mx-4 bg-[#2C1A10] border border-[#5C3D2E] rounded-md shadow-[0_8px_32px_rgba(202,138,4,0.3)] animate-[slideUp_300ms_ease-out]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3D2517]">
          <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04] flex items-center gap-2">
            <CreditCard size={18} />
            Catat Pengeluaran
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#BFA98A] rounded hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="period_id" value={periodId} />

          <div className="space-y-3">
            <div>
              <label className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1">
                <StickyNote size={14} className="inline mr-1" /> Keterangan
              </label>
              <input
                name="description"
                type="text"
                required
                placeholder="Token listrik, air..."
                className="w-full h-10 px-3 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Spectral] text-sm focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1">
                Nominal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-[Spectral] text-sm text-[#5C3D2E]">Rp</span>
                <input
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="50.000"
                  value={amountDisplay}
                  onChange={(e) => setAmountDisplay(formatThousands(e.target.value))}
                  className="w-full h-10 pl-9 pr-3 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Fira_Code] text-sm focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-[Spectral] text-sm font-medium text-[#F5E6D3] mb-1">
                <Calendar size={14} className="inline mr-1" /> Tanggal
              </label>
              <input
                name="date"
                type="date"
                defaultValue={todayISO()}
                className="w-full h-10 px-3 bg-[#2C1A10] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Spectral] text-sm focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {state?.error && (
            <div className="px-3 py-2 bg-[#991B1B]/15 border border-[#991B1B]/30 rounded font-[Spectral] text-xs text-[#F87171]">
              {state.error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#CA8A04] text-[#1A0F0A] border border-[#DAA520] rounded font-[Cinzel] text-sm font-bold uppercase tracking-wider hover:bg-[#B8780A] disabled:opacity-35 cursor-pointer"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
