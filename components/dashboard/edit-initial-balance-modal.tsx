'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, Wallet } from 'lucide-react';
import { updateInitialBalance } from '@/actions/cashflow';

interface EditInitialBalanceModalProps {
  periodId: string;
  currentValue: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditInitialBalanceModal({
  periodId,
  currentValue,
  onClose,
  onSuccess,
}: EditInitialBalanceModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // State for input amount. If currentValue is null, input is empty.
  const [amount, setAmount] = useState(currentValue !== null ? currentValue.toString() : '');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  async function handleSave() {
    setIsPending(true);
    setErrorMsg('');

    // Handle minus sign properly
    const isNegative = amount.trim().startsWith('-');
    const numericOnly = amount.replace(/[^0-9]/g, '');
    let finalAmount = null;

    if (numericOnly) {
      finalAmount = Number(numericOnly);
      if (isNegative) finalAmount = -finalAmount;
    } else if (amount.trim() !== '') {
      // User typed something invalid like just "-"
      setErrorMsg('Nominal tidak valid.');
      setIsPending(false);
      return;
    }

    // If input is empty, reset to auto (null)
    const val = amount.trim() === '' ? null : finalAmount;

    const res = await updateInitialBalance(periodId, val);
    if (!res.success) {
      setErrorMsg(res.error || 'Gagal menyimpan.');
    } else {
      onSuccess();
    }
    setIsPending(false);
  }

  async function handleResetAuto() {
    setIsPending(true);
    setErrorMsg('');
    const res = await updateInitialBalance(periodId, null);
    if (!res.success) {
      setErrorMsg(res.error || 'Gagal reset saldo.');
    } else {
      onSuccess();
    }
    setIsPending(false);
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#333333]/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
    >
      <div className="relative w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] animate-[slideUp_420ms_ease-out] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-[#333333] flex items-center gap-2">
            <Wallet className="text-[#008B8B]" size={20} />
            Atur Saldo Awal
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] rounded-full hover:bg-[#F3F4F6] hover:text-[#333333] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-[#6B7280]">
            Isi nominal di bawah jika Anda ingin menentukan Saldo Awal secara manual. Kosongkan untuk menghitung otomatis dari bulan lalu.
          </p>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              Nominal (Bisa Minus)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: -50000 atau 150000"
              className="w-full h-11 px-4 bg-[#FFFFFF] text-[#333333] border border-[#D1D5DB] rounded-xl font-mono text-sm focus:border-[#008B8B] focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1 focus:outline-none placeholder:font-sans placeholder:text-[#9CA3AF]"
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-[#EF4444] bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 h-11 bg-[#008B8B] text-[#FFFFFF] rounded-full text-sm font-bold transition-all duration-200 hover:bg-[#007676] hover:shadow-md active:translate-y-[1px] disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} /> Simpan
            </button>
            <button
              onClick={handleResetAuto}
              disabled={isPending || currentValue === null}
              className="w-full flex items-center justify-center gap-2 h-11 bg-[#FFFFFF] text-[#4B5563] border border-[#D1D5DB] rounded-full text-sm font-semibold transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#111827] active:translate-y-[1px] disabled:opacity-30 cursor-pointer"
            >
              <RotateCcw size={16} /> Kembalikan ke Otomatis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
