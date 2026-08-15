'use client';

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  StickyNote,
  Coins,
  X,
  ChevronDown,
} from 'lucide-react';
import { addIncome, deleteIncome, getIncomesByPeriod } from '@/actions/incomes';
import type { Member, Income } from '@/types/database';

// ============================================================
// Si Catat — Income Form & Transaction History
//
// 1. IncomeSection: Container utama (form + riwayat)
// 2. IncomeForm: Input iuran baru
// 3. IncomeHistory: Riwayat transaksi iuran
//
// QuestUI design system.
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

/** Format angka ke Rupiah display */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format input: auto titik ribuan saat mengetik */
function formatThousands(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

/** Tanggal hari ini dalam format YYYY-MM-DD */
function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format tanggal untuk display */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

// ============================================================
// IncomeSection: Container utama
// ============================================================

interface IncomeSectionProps {
  periodId: string;
  activeMembers: Member[];
  isAdmin: boolean;
}

export function IncomeSection({
  periodId,
  activeMembers,
  isAdmin,
}: IncomeSectionProps) {
  const [history, setHistory] = useState<
    (Income & { member_name: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getIncomesByPeriod(periodId);
      setHistory(data);
    } catch {
      console.error('Gagal memuat riwayat iuran');
    } finally {
      setIsLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-4">
      {/* Form input iuran (admin only) */}
      {isAdmin && (
        <IncomeForm
          periodId={periodId}
          activeMembers={activeMembers}
          onSuccess={loadHistory}
        />
      )}

      {/* Riwayat transaksi */}
      <IncomeHistory
        transactions={history}
        isAdmin={isAdmin}
        isLoading={isLoading}
        onDelete={loadHistory}
      />
    </div>
  );
}

// ============================================================
// IncomeForm: Form input iuran baru
// ============================================================

interface IncomeFormProps {
  periodId: string;
  activeMembers: Member[];
  onSuccess: () => void;
}

function IncomeForm({ periodId, activeMembers, onSuccess }: IncomeFormProps) {
  const [state, formAction, isPending] = useActionState(addIncome, null);
  const [amountDisplay, setAmountDisplay] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form setelah berhasil
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setAmountDisplay('');
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatThousands(e.target.value);
    setAmountDisplay(formatted);
  }

  return (
    <div className="bg-[#2C1A10] border border-[#5C3D2E] rounded shadow-[0_2px_8px_rgba(202,138,4,0.2)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3D2517]">
        <h3 className="font-[Cinzel] text-base font-semibold text-[#CA8A04] flex items-center gap-2">
          <Plus size={18} />
          Input Iuran
        </h3>
      </div>

      <form ref={formRef} action={formAction} className="p-4 space-y-3">
        {/* Hidden period_id */}
        <input type="hidden" name="period_id" value={periodId} />

        {/* Row 1: Anggota + Nominal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pilih anggota */}
          <div>
            <label
              htmlFor="income-member"
              className="block font-[Spectral] text-xs font-medium text-[#F5E6D3] mb-1"
            >
              Anggota
            </label>
            <div className="relative">
              <select
                id="income-member"
                name="member_id"
                required
                defaultValue=""
                className="
                  w-full h-10 px-3 pr-8
                  bg-[#2C1A10] text-[#F5E6D3]
                  border border-[#5C3D2E] rounded
                  font-[Spectral] text-sm
                  focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none
                  transition-all duration-200
                  appearance-none cursor-pointer
                "
              >
                <option value="" disabled className="text-[#5C3D2E]">
                  Pilih anggota...
                </option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C3D2E] pointer-events-none"
              />
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label
              htmlFor="income-amount"
              className="block font-[Spectral] text-xs font-medium text-[#F5E6D3] mb-1"
            >
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-[Spectral] text-xs text-[#5C3D2E]">
                Rp
              </span>
              <input
                id="income-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                required
                placeholder="100.000"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="
                  w-full h-10 pl-9 pr-3
                  bg-[#2C1A10] text-[#F5E6D3]
                  border border-[#5C3D2E] rounded
                  font-[Fira_Code] text-sm
                  placeholder:text-[#5C3D2E]
                  focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none
                  transition-all duration-200
                "
              />
            </div>
          </div>
        </div>

        {/* Row 2: Tanggal + Catatan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tanggal */}
          <div>
            <label
              htmlFor="income-date"
              className="block font-[Spectral] text-xs font-medium text-[#F5E6D3] mb-1"
            >
              <Calendar size={11} className="inline mr-1" />
              Tanggal
            </label>
            <input
              id="income-date"
              name="date"
              type="date"
              defaultValue={todayISO()}
              className="
                w-full h-10 px-3
                bg-[#2C1A10] text-[#F5E6D3]
                border border-[#5C3D2E] rounded
                font-[Spectral] text-sm
                focus:border-[#CA8A04] focus:ring-2 focus:ring-[#CA8A04]/25 focus:outline-none
                transition-all duration-200
                [color-scheme:dark]
              "
            />
          </div>

          {/* Catatan */}
          <div>
            <label
              htmlFor="income-note"
              className="block font-[Spectral] text-xs font-medium text-[#F5E6D3] mb-1"
            >
              <StickyNote size={11} className="inline mr-1" />
              Catatan (opsional)
            </label>
            <input
              id="income-note"
              name="note"
              type="text"
              placeholder="Cicilan 1, titip via Budi..."
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
        </div>

        {/* Error */}
        {state?.error && (
          <div className="px-3 py-2 bg-[#991B1B]/15 border border-[#991B1B]/30 rounded font-[Spectral] text-xs text-[#F87171]">
            {state.error}
          </div>
        )}

        {/* Success */}
        {state?.success && (
          <div className="px-3 py-2 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded font-[Spectral] text-xs text-[#22C55E]">
            ✓ Iuran berhasil dicatat.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="
            w-full sm:w-auto
            h-10 px-6
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
              <Coins size={16} />
              Simpan Iuran
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================
// IncomeHistory: Riwayat transaksi iuran
// ============================================================

interface IncomeHistoryProps {
  transactions: (Income & { member_name: string })[];
  isAdmin: boolean;
  isLoading: boolean;
  onDelete: () => void;
}

function IncomeHistory({
  transactions,
  isAdmin,
  isLoading,
  onDelete,
}: IncomeHistoryProps) {
  return (
    <div className="bg-[#2C1A10] border border-[#5C3D2E] rounded shadow-[0_2px_8px_rgba(202,138,4,0.2)]">
      <div className="px-4 py-3 border-b border-[#3D2517]">
        <h3 className="font-[Cinzel] text-base font-semibold text-[#CA8A04] flex items-center gap-2">
          <Coins size={18} />
          Riwayat Iuran
        </h3>
      </div>

      {isLoading ? (
        <div className="px-4 py-8 text-center">
          <span className="inline-block w-5 h-5 border-2 border-[#5C3D2E] border-t-[#CA8A04] rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="px-4 py-8 text-center font-[Spectral] text-sm text-[#5C3D2E] italic">
          Belum ada transaksi iuran bulan ini.
        </div>
      ) : (
        <div className="divide-y divide-[#3D2517]/50">
          {transactions.map((tx) => (
            <IncomeRow
              key={tx.id}
              transaction={tx}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// IncomeRow: Satu baris riwayat iuran
// ============================================================

interface IncomeRowProps {
  transaction: Income & { member_name: string };
  isAdmin: boolean;
  onDelete: () => void;
}

function IncomeRow({ transaction, isAdmin, onDelete }: IncomeRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    const result = await deleteIncome(transaction.id);
    if (result.success) {
      onDelete();
    }
    setIsPending(false);
    setShowConfirm(false);
  }

  return (
    <div className="px-4 py-3 hover:bg-[#3D2517]/20 transition-colors duration-150">
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-[Spectral] text-sm font-medium text-[#F5E6D3] truncate">
              {transaction.member_name}
            </span>
            <span className="font-[Spectral] text-[11px] text-[#5C3D2E]">
              {formatDate(transaction.date)}
            </span>
          </div>
          {transaction.note && (
            <p className="font-[Spectral] text-xs text-[#BFA98A] italic truncate">
              {transaction.note}
            </p>
          )}
        </div>

        {/* Amount + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-[Fira_Code] text-sm text-[#22C55E] tabular-nums">
            +{formatRupiah(transaction.amount)}
          </span>

          {isAdmin && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              title="Hapus transaksi"
              className="
                p-1 text-[#5C3D2E] rounded
                hover:text-[#991B1B] hover:bg-[#991B1B]/10
                transition-colors duration-200
                cursor-pointer
              "
            >
              <Trash2 size={14} />
            </button>
          )}

          {isAdmin && showConfirm && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="
                  px-2 py-1 text-[10px] font-[Cinzel] uppercase
                  bg-[#991B1B] text-[#F5E6D3] border border-[#B91C1C] rounded
                  hover:bg-[#7F1D1D]
                  disabled:opacity-35
                  cursor-pointer
                "
              >
                {isPending ? '...' : 'Hapus'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 text-[#5C3D2E] hover:text-[#BFA98A] cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
