import { Suspense } from 'react';
import { checkIsAdmin } from '@/lib/auth';
import {
  getOrCreateCurrentPeriod,
  getPeriodSummary,
  getAllPeriods,
  getMonthName,
} from '@/actions/cashflow';
import { getMembersWithTotalPaid } from '@/actions/incomes';
import { getAllMembers, getActiveMembers } from '@/actions/members';
import { getExpenses } from '@/actions/expenses';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

// ============================================================
// Si Catat — Dashboard Utama (Unified)
// ============================================================

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>;
}) {
  const { periodId: selectedPeriodId } = await searchParams;
  const isAdmin = await checkIsAdmin();

  // 1. Ambil daftar semua periode untuk dropdown
  const allPeriods = await getAllPeriods();

  // 2. Tentukan periode yang aktif
  let currentPeriod;
  if (selectedPeriodId) {
    currentPeriod = allPeriods.find((p) => p.id === selectedPeriodId);
    if (!currentPeriod) {
      currentPeriod = await getOrCreateCurrentPeriod(); // Fallback
    }
  } else {
    currentPeriod = await getOrCreateCurrentPeriod();
  }

  // 3. Fetch data untuk periode tersebut secara paralel
  const [summary, memberSummaries, expenses, allMembersList, activeMembersList] =
    await Promise.all([
      getPeriodSummary(currentPeriod.id),
      getMembersWithTotalPaid(currentPeriod.id),
      getExpenses(currentPeriod.id),
      getAllMembers(),
      getActiveMembers(),
    ]);

  const monthName = await getMonthName(currentPeriod.month);

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-96 animate-pulse bg-[#2C1A10] rounded" />}>
        <DashboardClient
          isAdmin={isAdmin}
          currentPeriod={currentPeriod}
          allPeriods={allPeriods}
          summary={summary}
          memberSummaries={memberSummaries}
          expenses={expenses}
          allMembers={allMembersList}
          activeMembers={activeMembersList}
          monthName={monthName}
        />
      </Suspense>
    </div>
  );
}
