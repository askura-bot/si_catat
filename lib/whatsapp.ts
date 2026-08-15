import type { PeriodSummary, Expense } from '@/types/database';

function formatRp(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateWhatsAppSummary(
  summary: PeriodSummary,
  expenses: Expense[],
  monthName: string,
  year: number
): string {
  const monthYear = `${monthName} ${year}`;
  const totalIncome = summary.total_income;
  const carryOver = summary.carry_over;
  const totalIn = summary.total_kas_masuk;
  const totalOut = summary.total_expense;
  const balance = summary.sisa_saldo;

  const expenseLines = expenses.length > 0 
    ? expenses.map((e) => `• ${e.description} = ${formatRp(e.amount)}`).join('\n')
    : '• Belum ada pengeluaran';

  return `📢 REKAP KAS KONTRAKAN - ${monthYear}
------------------------------------
📥 PEMASUKAN
• Total Iuran Masuk: ${formatRp(totalIncome)}
• Sisa Kas Bulan Lalu: ${formatRp(carryOver)}
Total Masuk = ${formatRp(totalIn)}

📤 PENGELUARAN ${monthName}
${expenseLines}
Total Keluar = ${formatRp(totalOut)}
------------------------------------
💰 SISA SALDO: ${formatRp(balance)}`;
}
