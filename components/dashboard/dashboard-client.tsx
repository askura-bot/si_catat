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
  Pencil,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank
} from 'lucide-react';
import { generateWhatsAppSummary } from '@/lib/whatsapp';
import type { Period, PeriodSummary, Expense, Member, MemberIncomeSummary } from '@/types/database';

import { IncomeModal } from './income-modal';
import { ExpenseModal } from './expense-modal';
import { ManageMembersModal } from './manage-members-modal';
import { EditInitialBalanceModal } from './edit-initial-balance-modal';
import { MemberIncomeHistoryModal } from './member-income-history-modal';
import { deleteIncome } from '@/actions/incomes';
import { deleteExpense } from '@/actions/expenses';
import type { Income } from '@/types/database';

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
  incomes: Income[];
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
  incomes,
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
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<{ id: string; name: string } | null>(null);
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
      <div>
        <h2 className="text-2xl font-bold text-[#333333] tracking-tight">
          Overview
        </h2>
        <p className="text-sm text-[#6B7280]">
          Ringkasan finansial dan riwayat transaksi
        </p>
      </div>
      <div className="relative shrink-0">
        <select
          value={currentPeriod.id}
          onChange={handlePeriodChange}
          className="
            h-10 pl-4 pr-10
            bg-[#FFFFFF] text-[#333333]
            border border-[#D1D5DB] rounded-full
            text-sm font-medium
            focus:border-[#008B8B] focus:outline-none focus:ring-2 focus:ring-[#008B8B] focus:ring-offset-1
            appearance-none cursor-pointer shadow-sm
            transition-all duration-200
          "
        >
          {allPeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
      </div>
    </div>
  );

  // ── Summary Cards ────────────────────────────────────────────
  const SummarySection = (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        { 
          id: 'carry_over', 
          label: 'Saldo Awal', 
          value: summary.carry_over, 
          sub: currentPeriod.initial_balance !== null ? 'Manual override' : 'Bulan lalu',
          icon: Wallet,
          color: '#20B2AA'
        },
        { 
          id: 'income', 
          label: 'Total Iuran', 
          value: summary.total_income, 
          sub: 'Masuk bulan ini',
          icon: TrendingUp,
          color: '#10B981'
        },
        { 
          id: 'expense', 
          label: 'Total Pengeluaran', 
          value: summary.total_expense, 
          sub: 'Keluar bulan ini', 
          isExpense: true,
          icon: TrendingDown,
          color: '#EF4444'
        },
      ].map((card) => (
        <div key={card.label} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative group overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10"
                style={{ backgroundColor: `${card.color}15`, color: card.color }}
              >
                <card.icon size={20} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-[#6B7280]">{card.label}</p>
            </div>
            
            {isAdmin && card.id === 'carry_over' && (
              <button
                onClick={() => setShowEditBalance(true)}
                title="Atur Saldo Awal"
                className="p-1.5 text-[#9CA3AF] hover:text-[#008B8B] hover:bg-[#F3F4F6] rounded-full transition-colors cursor-pointer"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          <p className={`font-mono text-2xl font-bold tracking-tight ${card.isExpense && card.value > 0 ? 'text-[#EF4444]' : card.value < 0 ? 'text-[#EF4444]' : 'text-[#333333]'}`}>
            {card.isExpense && card.value > 0 ? '-' : ''}{formatRupiah(Math.abs(card.value))}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1 font-medium">{card.sub}</p>
        </div>
      ))}
      
      {/* Sisa Saldo Card - Emphasized */}
      <div className={`border-2 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative overflow-hidden ${summary.sisa_saldo >= 0 ? 'bg-[#FFFFFF] border-[#008B8B]/40' : 'bg-[#FFFFFF] border-[#EF4444]/40'}`}>
        <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-[0.03] pointer-events-none">
          <PiggyBank size={120} />
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${summary.sisa_saldo >= 0 ? 'bg-[#008B8B]/10 text-[#008B8B]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}
            >
              <PiggyBank size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-[#333333]">Sisa Saldo Kas</p>
          </div>
        </div>
        <p className={`font-mono text-3xl font-extrabold tracking-tight ${summary.sisa_saldo >= 0 ? 'text-[#008B8B]' : 'text-[#EF4444]'}`}>
          {summary.sisa_saldo < 0 ? '-' : ''}{formatRupiah(Math.abs(summary.sisa_saldo))}
        </p>
        <p className={`text-xs font-semibold mt-1 ${summary.sisa_saldo >= 0 ? 'text-[#008B8B]/70' : 'text-[#EF4444]/70'}`}>
          {summary.sisa_saldo >= 0 ? 'Tersedia saat ini' : '⚠ Defisit'}
        </p>
      </div>
    </div>
  );

  // ── Action Buttons ───────────────────────────────────────────
  const ActionButtons = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleCopyWA}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#008B8B] border border-[#D1D5DB] rounded-full text-sm font-semibold transition-all duration-200 hover:bg-[#F3F4F6] hover:border-[#008B8B] active:translate-y-[1px] cursor-pointer shadow-sm"
      >
        {copiedWA ? <Check size={16} /> : <Share2 size={16} />}
        {copiedWA ? 'Tersalin!' : 'Salin Rekap WA'}
      </button>

      {isAdmin && (
        <>
          <div className="flex-1 min-w-[20px]" />
          <button
            onClick={() => setShowIncomeModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008B8B] text-[#FFFFFF] rounded-full text-sm font-bold transition-all duration-200 hover:bg-[#007676] hover:shadow-md active:translate-y-[1px] cursor-pointer"
          >
            <Coins size={16} />
            Catat Iuran
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#008B8B] border border-[#008B8B] rounded-full text-sm font-bold transition-all duration-200 hover:bg-[#008B8B]/5 hover:shadow-sm active:translate-y-[1px] cursor-pointer"
          >
            <CreditCard size={16} />
            Pengeluaran
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#4B5563] border border-[#D1D5DB] rounded-full text-sm font-semibold transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#111827] active:translate-y-[1px] cursor-pointer shadow-sm"
          >
            <Users size={16} />
            Kelola Anggota
          </button>
        </>
      )}
    </div>
  );

  // ── Tab Navigation ───────────────────────────────────────────
  const TabsSection = (
    <div className="flex border-b border-[#E5E7EB] gap-8 px-4">
      <button
        onClick={() => setActiveTab('incomes')}
        className={`py-4 text-sm font-semibold transition-colors relative ${activeTab === 'incomes' ? 'text-[#008B8B]' : 'text-[#6B7280] hover:text-[#333333]'}`}
      >
        Iuran Anggota
        {activeTab === 'incomes' && (
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#008B8B] rounded-t-full animate-[fadeIn_200ms_ease-out]" />
        )}
      </button>
      <button
        onClick={() => setActiveTab('expenses')}
        className={`py-4 text-sm font-semibold transition-colors relative ${activeTab === 'expenses' ? 'text-[#008B8B]' : 'text-[#6B7280] hover:text-[#333333]'}`}
      >
        Riwayat Pengeluaran
        {activeTab === 'expenses' && (
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#008B8B] rounded-t-full animate-[fadeIn_200ms_ease-out]" />
        )}
      </button>
    </div>
  );

  // ── Tab Content: Incomes ─────────────────────────────────────
  const IncomesContent = (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-t-0 rounded-b-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Nama Anggota</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Bulan Ini</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {memberSummaries.length === 0 ? (
              <tr><td colSpan={2} className="px-6 py-12 text-center text-sm text-[#9CA3AF] italic">Belum ada data anggota aktif.</td></tr>
            ) : (
              memberSummaries.map((m) => (
                <tr key={m.member_id} className="hover:bg-[#F8F9FA] transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-[#333333] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#008B8B]/10 flex items-center justify-center text-[#008B8B] font-bold text-xs">
                      {m.member_name.charAt(0).toUpperCase()}
                    </div>
                    {m.member_name}
                    {isAdmin && (
                      <button
                        onClick={() => setSelectedMemberForHistory({ id: m.member_id, name: m.member_name })}
                        title="Edit Iuran Anggota"
                        className="p-1.5 ml-2 text-[#9CA3AF] opacity-0 group-hover:opacity-100 hover:text-[#008B8B] hover:bg-[#E5E7EB] rounded-full transition-all cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums">
                    {m.total_amount > 0 ? (
                      <span className="text-[#10B981]">{formatRupiah(m.total_amount)}</span>
                    ) : (
                      <span className="text-[#9CA3AF]">Rp 0</span>
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
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] border-t-0 rounded-b-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      {expenses.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-[#9CA3AF] italic">
          Belum ada riwayat pengeluaran bulan ini.
        </div>
      ) : (
        <div className="divide-y divide-[#F3F4F6]">
          {expenses.map((tx) => (
            <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-sm font-medium text-[#333333] truncate">{tx.description}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(tx.date)}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-sm font-semibold text-[#EF4444] tabular-nums">
                  -{formatRupiah(tx.amount)}
                </span>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm('Hapus transaksi ini?')) {
                        await deleteExpense(tx.id);
                        handleRefresh();
                      }
                    }}
                    className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-full transition-colors cursor-pointer"
                    title="Hapus Pengeluaran"
                  >
                    <X size={16} />
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
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm pt-2">
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
      {showEditBalance && (
        <EditInitialBalanceModal
          periodId={currentPeriod.id}
          currentValue={currentPeriod.initial_balance}
          onClose={() => setShowEditBalance(false)}
          onSuccess={handleRefresh}
        />
      )}
      {selectedMemberForHistory && (
        <MemberIncomeHistoryModal
          memberId={selectedMemberForHistory.id}
          memberName={selectedMemberForHistory.name}
          incomes={incomes}
          onClose={() => setSelectedMemberForHistory(null)}
          onSuccess={handleRefresh}
        />
      )}
    </>
  );
}
