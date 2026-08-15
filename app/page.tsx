import { checkIsAdmin } from '@/lib/auth';
import { getOrCreateCurrentPeriod, getCurrentPeriodSummary, getMonthName } from '@/actions/cashflow';
import { getMembersWithTotalPaid } from '@/actions/incomes';
import { getAllMembers, getActiveMembers } from '@/actions/members';
import { MemberList } from '@/components/members/member-list';
import { IncomeSection } from '@/components/incomes/income-section';

// ============================================================
// Si Catat — Dashboard Utama
// Server Component: data di-fetch di server, lalu dikirim ke
// client components sebagai props.
// ============================================================

export default async function Home() {
  const isAdmin = await checkIsAdmin();
  const period = await getOrCreateCurrentPeriod();
  const summary = await getCurrentPeriodSummary();
  const memberSummaries = await getMembersWithTotalPaid(period.id);
  const allMembers = await getAllMembers();
  const activeMembers = await getActiveMembers();

  const monthLabel = `${await getMonthName(period.month)} ${period.year}`;

  return (
    <div className="space-y-6">
      {/* ── Judul Periode ──────────────────────────── */}
      <div className="text-center">
        <h2 className="font-[Cinzel] text-2xl font-bold text-[#CA8A04] tracking-wide">
          Kas Kontrakan
        </h2>
        <p className="font-[Spectral] text-sm text-[#BFA98A] mt-1">
          Periode: {monthLabel}
        </p>
      </div>

      {/* ── Kartu Ringkasan Finansial ──────────────── */}
      <SummaryCards summary={summary} />

      {/* ── Tabel Iuran Anggota ────────────────────── */}
      <MemberList
        members={memberSummaries}
        allMembers={allMembers}
        isAdmin={isAdmin}
      />

      {/* ── Input & Riwayat Iuran ──────────────────── */}
      <IncomeSection
        periodId={period.id}
        activeMembers={activeMembers}
        isAdmin={isAdmin}
      />
    </div>
  );
}

// ============================================================
// SummaryCards: Kartu-kartu ringkasan keuangan
// ============================================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SummaryCardsProps {
  summary: {
    carry_over: number;
    total_income: number;
    total_kas_masuk: number;
    total_expense: number;
    sisa_saldo: number;
  };
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Saldo Awal',
      value: summary.carry_over,
      sublabel: 'Sisa bulan lalu',
    },
    {
      label: 'Iuran Masuk',
      value: summary.total_income,
      sublabel: 'Bulan ini',
    },
    {
      label: 'Total Kas Masuk',
      value: summary.total_kas_masuk,
      sublabel: 'Saldo awal + iuran',
    },
    {
      label: 'Total Pengeluaran',
      value: summary.total_expense,
      sublabel: 'Bulan ini',
      isExpense: true,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Grid kartu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="
              bg-[#2C1A10] border border-[#5C3D2E] rounded
              px-4 py-3
              shadow-[0_2px_8px_rgba(202,138,4,0.15)]
            "
          >
            <p className="font-[Cinzel] text-[10px] uppercase tracking-[1px] text-[#BFA98A] mb-1">
              {card.label}
            </p>
            <p
              className={`font-[Fira_Code] text-lg font-semibold tabular-nums ${
                card.isExpense && card.value > 0
                  ? 'text-[#F87171]'
                  : card.value < 0
                    ? 'text-[#F87171]'
                    : 'text-[#F5E6D3]'
              }`}
            >
              {card.isExpense && card.value > 0 ? '-' : ''}
              {formatRupiah(Math.abs(card.value))}
            </p>
            <p className="font-[Spectral] text-[11px] text-[#5C3D2E] mt-0.5">
              {card.sublabel}
            </p>
          </div>
        ))}
      </div>

      {/* Kartu Sisa Saldo (highlight) */}
      <div
        className={`
          border-2 rounded px-4 py-4 text-center
          shadow-[0_4px_16px_rgba(202,138,4,0.25)]
          ${
            summary.sisa_saldo >= 0
              ? 'bg-[#2C1A10] border-[#CA8A04]/60'
              : 'bg-[#2C1A10] border-[#991B1B]/60'
          }
        `}
      >
        <p className="font-[Cinzel] text-[11px] uppercase tracking-[1.5px] text-[#BFA98A] mb-1">
          💰 Sisa Saldo Kas
        </p>
        <p
          className={`font-[Fira_Code] text-2xl font-bold tabular-nums ${
            summary.sisa_saldo >= 0 ? 'text-[#22C55E]' : 'text-[#F87171]'
          }`}
        >
          {summary.sisa_saldo < 0 ? '-' : ''}
          {formatRupiah(Math.abs(summary.sisa_saldo))}
        </p>
        {summary.sisa_saldo < 0 && (
          <p className="font-[Spectral] text-xs text-[#F87171] mt-1">
            ⚠ Saldo defisit — akan terbawa ke bulan berikutnya
          </p>
        )}
      </div>
    </div>
  );
}
