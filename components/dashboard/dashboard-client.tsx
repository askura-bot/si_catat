'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Check,
  Coins,
  CreditCard,
  Users,
  ChevronDown,
  X,
} from 'lucide-react';
import { generateWhatsAppSummary } from '@/lib/whatsapp';
import type { Period, PeriodSummary, Expense, Member, MemberIncomeSummary } from '@/types/database';

import { IncomeModal } from './income-modal';
import { ExpenseModal } from './expense-modal';
import { ManageMembersModal } from './manage-members-modal';
import { deleteIncome } from '@/actions/incomes';
import { deleteExpense } from '@/actions/expenses';

// Format helper
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

interface PeriodWithLabel extends Period {
  label: string;
}

interface DashboardClientProps {
  isAdmin: boolean;
  currentPeriod: Period;
  allPeriods: PeriodWithLabel[];
  summary: PeriodSummary;
  memberSummaries: MemberIncomeSummary[];
  expenses: Expense[];
  allMembers: Member[];
  activeMembers: Member[];
  monthName: string;
}

export function DashboardClient({
  isAdmin,
  currentPeriod,
  allPeriods,
  summary,
  memberSummaries,
  expenses,
  allMembers,
  activeMembers,
  monthName,
}: DashboardClientProps) {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<'incomes' | 'expenses'>('incomes');
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);

  // Handlers
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/?periodId=${e.target.value}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleCopyWA = async () => {
    const text = generateWhatsAppSummary(summary, expenses, monthName, currentPeriod.year);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 3000);
    } catch (err) {
      alert('Gagal menyalin ke clipboard.');
    }
  };

  // ── Header & Period Selector ──────────────────────────────────
  const HeaderSection = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-[Cinzel] text-2xl font-bold text-[#CA8A04] tracking-wide">
          Kas Kontrakan
        </h2>
      </div>
      <div className="relative">
        <select
          value={currentPeriod.id}
          onChange={handlePeriodChange}
          className="
            h-9 pl-3 pr-8
            bg-[#2C1A10] text-[#F5E6D3]
            border border-[#5C3D2E] rounded
            font-[Spectral] text-sm font-medium
            focus:border-[#CA8A04] focus:outline-none focus:ring-1 focus:ring-[#CA8A04]
            appearance-none cursor-pointer
          "
        >
          {allPeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CA8A04] pointer-events-none" />
      </div>
    </div>
  );

  // ── Summary Cards ────────────────────────────────────────────
  const SummarySection = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: 'Saldo Awal', value: summary.carry_over, sub: 'Bulan lalu' },
        { label: 'Total Iuran', value: summary.total_income, sub: 'Masuk bulan ini' },
        { label: 'Total Pengeluaran', value: summary.total_expense, sub: 'Keluar bulan ini', isExpense: true },
      ].map((card) => (
        <div key={card.label} className="bg-[#2C1A10] border border-[#5C3D2E] rounded px-4 py-3 shadow-[0_2px_8px_rgba(202,138,4,0.15)]">
          <p className="font-[Cinzel] text-[10px] uppercase tracking-[1px] text-[#BFA98A] mb-1">{card.label}</p>
          <p className={`font-[Fira_Code] text-lg font-semibold tabular-nums ${card.isExpense && card.value > 0 ? 'text-[#F87171]' : card.value < 0 ? 'text-[#F87171]' : 'text-[#F5E6D3]'}`}>
            {card.isExpense && card.value > 0 ? '-' : ''}{formatRupiah(Math.abs(card.value))}
          </p>
          <p className="font-[Spectral] text-[11px] text-[#5C3D2E] mt-0.5">{card.sub}</p>
        </div>
      ))}
      <div className={`border-2 rounded px-4 py-3 shadow-[0_4px_16px_rgba(202,138,4,0.25)] ${summary.sisa_saldo >= 0 ? 'bg-[#2C1A10] border-[#CA8A04]/60' : 'bg-[#2C1A10] border-[#991B1B]/60'}`}>
        <p className="font-[Cinzel] text-[10px] uppercase tracking-[1px] text-[#BFA98A] mb-1">💰 Sisa Saldo Kas</p>
        <p className={`font-[Fira_Code] text-xl font-bold tabular-nums ${summary.sisa_saldo >= 0 ? 'text-[#22C55E]' : 'text-[#F87171]'}`}>
          {summary.sisa_saldo < 0 ? '-' : ''}{formatRupiah(Math.abs(summary.sisa_saldo))}
        </p>
        <p className={`font-[Spectral] text-[11px] mt-0.5 ${summary.sisa_saldo >= 0 ? 'text-[#5C3D2E]' : 'text-[#F87171]'}`}>
          {summary.sisa_saldo >= 0 ? 'Tersedia saat ini' : '⚠ Defisit'}
        </p>
      </div>
    </div>
  );

  // ── Action Buttons ───────────────────────────────────────────
  const ActionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopyWA}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/40 rounded font-[Cinzel] text-xs font-semibold uppercase tracking-wider hover:bg-[#22C55E]/20 transition-all cursor-pointer"
      >
        {copiedWA ? <Check size={14} /> : <Share2 size={14} />}
        {copiedWA ? 'Tersalin!' : 'Salin Rekap WA'}
      </button>

      {isAdmin && (
        <>
          <div className="flex-1 min-w-[20px]" />
          <button
            onClick={() => setShowIncomeModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CA8A04] text-[#1A0F0A] border border-[#DAA520] rounded font-[Cinzel] text-xs font-bold uppercase tracking-wider hover:bg-[#B8780A] transition-all cursor-pointer"
          >
            <Coins size={14} />
            + Iuran
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CA8A04]/10 text-[#CA8A04] border border-[#CA8A04]/40 rounded font-[Cinzel] text-xs font-semibold uppercase tracking-wider hover:bg-[#CA8A04]/20 transition-all cursor-pointer"
          >
            <CreditCard size={14} />
            + Pengeluaran
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3D2517] text-[#BFA98A] border border-[#5C3D2E] rounded font-[Cinzel] text-xs font-semibold uppercase tracking-wider hover:bg-[#5C3D2E] hover:text-[#F5E6D3] transition-all cursor-pointer"
          >
            <Users size={14} />
            Kelola Anggota
          </button>
        </>
      )}
    </div>
  );

  // ── Tab Navigation ───────────────────────────────────────────
  const TabsSection = (
    <div className="flex border-b border-[#3D2517]">
      <button
        onClick={() => setActiveTab('incomes')}
        className={`flex-1 py-3 text-sm font-[Cinzel] font-semibold uppercase tracking-wider transition-colors ${activeTab === 'incomes' ? 'text-[#CA8A04] border-b-2 border-[#CA8A04]' : 'text-[#BFA98A] hover:text-[#F5E6D3]'}`}
      >
        Iuran Anggota
      </button>
      <button
        onClick={() => setActiveTab('expenses')}
        className={`flex-1 py-3 text-sm font-[Cinzel] font-semibold uppercase tracking-wider transition-colors ${activeTab === 'expenses' ? 'text-[#CA8A04] border-b-2 border-[#CA8A04]' : 'text-[#BFA98A] hover:text-[#F5E6D3]'}`}
      >
        Riwayat Pengeluaran
      </button>
    </div>
  );

  // ── Tab Content: Incomes ─────────────────────────────────────
  const IncomesContent = (
    <div className="bg-[#2C1A10] border border-[#5C3D2E] border-t-0 rounded-b shadow-[0_2px_8px_rgba(202,138,4,0.1)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3D2517]">
              <th className="px-4 py-3 text-left font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#BFA98A]">Nama</th>
              <th className="px-4 py-3 text-right font-[Cinzel] text-[11px] uppercase tracking-[1px] text-[#BFA98A]">Total Iuran Bulan Ini</th>
            </tr>
          </thead>
          <tbody>
            {memberSummaries.length === 0 ? (
              <tr><td colSpan={2} className="px-4 py-8 text-center font-[Spectral] text-sm text-[#5C3D2E] italic">Belum ada data anggota.</td></tr>
            ) : (
              memberSummaries.map((m) => (
                <tr key={m.member_id} className="border-b border-[#3D2517]/50 hover:bg-[#3D2517]/30 transition-colors">
                  <td className="px-4 py-3 font-[Spectral] text-sm text-[#F5E6D3]">{m.member_name}</td>
                  <td className="px-4 py-3 text-right font-[Fira_Code] text-sm text-[#F5E6D3] tabular-nums">
                    {m.total_amount > 0 ? (
                      <span className="text-[#22C55E]">{formatRupiah(m.total_amount)}</span>
                    ) : (
                      <span className="text-[#5C3D2E]">Rp 0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Tab Content: Expenses ────────────────────────────────────
  const ExpensesContent = (
    <div className="bg-[#2C1A10] border border-[#5C3D2E] border-t-0 rounded-b shadow-[0_2px_8px_rgba(202,138,4,0.1)]">
      {expenses.length === 0 ? (
        <div className="px-4 py-8 text-center font-[Spectral] text-sm text-[#5C3D2E] italic">
          Belum ada pengeluaran bulan ini.
        </div>
      ) : (
        <div className="divide-y divide-[#3D2517]/50">
          {expenses.map((tx) => (
            <div key={tx.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-[#3D2517]/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-[Spectral] text-sm font-medium text-[#F5E6D3] truncate">{tx.description}</p>
                <p className="font-[Spectral] text-xs text-[#BFA98A] italic truncate">{formatDate(tx.date)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-[Fira_Code] text-sm text-[#F87171] tabular-nums">-{formatRupiah(tx.amount)}</span>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm('Hapus transaksi ini?')) {
                        await deleteExpense(tx.id);
                        handleRefresh();
                      }
                    }}
                    className="text-[#5C3D2E] hover:text-[#991B1B] transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {HeaderSection}
        {SummarySection}
        {ActionButtons}
        <div>
          {TabsSection}
          {activeTab === 'incomes' ? IncomesContent : ExpensesContent}
        </div>
      </div>

      {/* Modals */}
      {showIncomeModal && (
        <IncomeModal periodId={currentPeriod.id} activeMembers={activeMembers} onClose={() => setShowIncomeModal(false)} onSuccess={handleRefresh} />
      )}
      {showExpenseModal && (
        <ExpenseModal periodId={currentPeriod.id} onClose={() => setShowExpenseModal(false)} onSuccess={handleRefresh} />
      )}
      {showManageModal && (
        <ManageMembersModal allMembers={allMembers} onClose={() => setShowManageModal(false)} onSuccess={handleRefresh} />
      )}
    </>
  );
}
