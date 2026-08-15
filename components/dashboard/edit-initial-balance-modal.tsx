'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
    >
      <div className="relative w-full max-w-sm bg-[#2C1A10] border border-[#5C3D2E] rounded-md shadow-[0_8px_32px_rgba(202,138,4,0.3)] animate-[slideUp_300ms_ease-out] flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#CA8A04] rounded-t-md" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3D2517]">
          <h2 className="font-[Cinzel] text-lg font-bold text-[#CA8A04]">
            Atur Saldo Awal
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#BFA98A] rounded hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="font-[Spectral] text-sm text-[#F5E6D3]">
            Isi nominal di bawah jika Anda ingin menentukan Saldo Awal secara manual. Kosongkan untuk menghitung otomatis dari bulan lalu.
          </p>

          <div>
            <label className="block font-[Spectral] text-sm text-[#BFA98A] mb-1.5">
              Nominal (Bisa Minus)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: -50000 atau 150000"
              className="w-full h-10 px-3 bg-[#1A0F0A] text-[#F5E6D3] border border-[#5C3D2E] rounded font-[Fira_Code] text-sm focus:border-[#CA8A04] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="text-sm font-[Spectral] text-[#F87171] bg-[#F87171]/10 px-3 py-2 rounded">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 h-10 bg-[#CA8A04] text-[#1A0F0A] border border-[#DAA520] rounded font-[Cinzel] text-sm font-bold uppercase tracking-wider hover:bg-[#B8780A] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} /> Simpan
            </button>
            <button
              onClick={handleResetAuto}
              disabled={isPending || currentValue === null}
              className="w-full flex items-center justify-center gap-2 h-10 bg-[#2C1A10] text-[#BFA98A] border border-[#3D2517] rounded font-[Cinzel] text-xs font-semibold uppercase tracking-wider hover:bg-[#3D2517] hover:text-[#F5E6D3] transition-colors disabled:opacity-30 cursor-pointer"
            >
              <RotateCcw size={14} /> Kembalikan ke Otomatis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
