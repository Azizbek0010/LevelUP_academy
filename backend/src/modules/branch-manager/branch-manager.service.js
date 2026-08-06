import * as adminService from '../admin/admin.service.js';
import * as repo from './branch-manager.repository.js';
import * as reportsRepo from '../admin/reports/reports.repository.js';
import { parsePagination, buildPageMeta } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';

export async function dashboard(branchId) {
  return adminService.dashboard(branchId);
}

export async function branch(branchId) {
  const stats = await repo.branchStats(branchId);
  if (!stats) throw new AppError(404, 'Branch not found');
  return {
    stats: {
      students: stats.students,
      mentors: stats.mentors,
      groups: stats.groups,
      admins: stats.admins,
      revenue: Number(stats.revenue),
      expenses: Number(stats.expenses),
      profit: Number(stats.revenue) - Number(stats.expenses),
      debt: Number(stats.debt),
      currency: 'UZS',
    },
  };
}

export async function income(branchId, query) {
  const month = query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new AppError(422, 'Invalid month format, expected YYYY-MM');
  }
  const { page, limit, offset } = parsePagination(query);
  const from = `${month}-01`;
  const to = new Date(new Date(from).getFullYear(), new Date(from).getMonth() + 1, 0);
  const toDate = to.toISOString().slice(0, 10);

  const [rows, total] = await Promise.all([
    repo.listBranchPayments(branchId, { from, to: toDate }),
    repo.countBranchPayments(branchId, { from, to: toDate }),
  ]);

  const payments = rows.map((inv) => ({
    id: inv.id,
    date: inv.created_at?.slice(0, 10) ?? '',
    student: `${inv.student_first ?? ''} ${inv.student_last ?? ''}`.trim() || '—',
    group: inv.group_name ?? null,
    amount: Number(inv.total_amount),
    method: inv.paid_amount > 0 ? 'Karta' : 'Naqd',
    status: inv.status === 'paid' ? 'paid' : inv.status === 'partially_paid' ? 'pending' : 'overdue',
  }));

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments,
    meta: buildPageMeta(total, page, limit),
    total: totalAmount,
  };
}

export async function expenses(branchId, query) {
  return adminService.listExpenses(branchId, query);
}

export async function reports(branchId, query) {
  const range = query.range || '6m';
  const monthsBack = range === '3m' ? 3 : range === '12m' ? 12 : 6;
  const now = new Date();
  const series = [];

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1 + i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const totals = await reportsRepo.branchTotals(branchId, {
      from: d.toISOString().slice(0, 10),
      to: monthEnd.toISOString().slice(0, 10),
    });

    const revenue = Number(totals.revenue);
    const expenses = Number(totals.debt);
    series.push({
      key,
      label,
      income: revenue,
      expenses,
      profit: revenue - expenses,
    });
  }

  return { range, series };
}