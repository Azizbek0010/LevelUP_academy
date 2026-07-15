import argon2 from 'argon2';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { computeBill, tierForStudents, TIERS } from '../../config/plans.js';
import { genTempPassword } from '../auth/credentials.js';
import * as repo from './main.repository.js';

/**
 * Онбординг партнёра: создаём организацию + её Super Admin одной транзакцией.
 * Super Admin получает временный пароль (показывается Main Admin'у один раз;
 * дальше партнёр меняет через forgot-password по email).
 */
export async function onboardPartner({ organizationName, domain, admin, leadId }) {
  return withTransaction(async (client) => {
    if (domain && (await repo.findOrgByDomain(domain, client))) {
      throw new AppError(409, 'Domain already taken');
    }

    // план pro/max убран: цена считается по факту (филиалы+ученики), не по плану
    const org = await repo.insertOrganization(
      { name: organizationName, domain },
      client,
    );

    const tempPassword = genTempPassword();
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

    let superadmin;
    try {
      superadmin = await repo.insertSuperadmin(
        { orgId: org.id, ...admin, passwordHash },
        client,
      );
    } catch (err) {
      if (err.code === '23505') throw new AppError(409, 'Email already in use');
      throw err;
    }

    await repo.setOrgOwner(org.id, superadmin.id, client);

    // если онбордим из заявки — помечаем её onboarded и связываем с орг
    if (leadId) await repo.markLeadOnboarded(leadId, org.id, client);

    return {
      organization: org,
      superadmin: {
        id: superadmin.id,
        firstName: superadmin.first_name,
        lastName: superadmin.last_name,
        email: superadmin.email,
      },
      // показать один раз — Main Admin передаёт партнёру
      tempPassword,
    };
  });
}

function decoratePartner(row) {
  const students = Number(row.students);
  const branches = Number(row.branches);
  const revenue = Number(row.revenue);
  const expenses = Number(row.expenses);
  const tier = tierForStudents(students);
  return {
    id: row.id,
    name: row.name,
    plan: row.plan,
    domain: row.domain,
    status: row.status,
    createdAt: row.created_at,
    branches,
    students,
    tier: tier.label, // тариф по числу учеников (Free/Start/…)
    monthlyBill: computeBill({ students }), // сколько партнёр платит нам (сумы), филиалы не влияют
    revenue, // доход партнёра (оплаты его студентов по всем филиалам)
    expenses, // расходы партнёра
    profit: revenue - expenses,
  };
}

// ---------- цены платформы ----------

export function getPricing() {
  // Тарифы теперь в config/plans.js (TIERS). Редактирование через БД — v2.
  return { tiers: TIERS, currency: 'UZS' };
}

export async function updatePricing() {
  // Цены зашиты в config (TIERS) — правка через API отключена (v2: сделать DB-editable).
  return getPricing();
}

export async function listPartners() {
  const rows = await repo.listPartners();
  return rows.map((row) => decoratePartner(row));
}

/** Платформенный дашборд: наш доход = сумма счетов партнёров; плюс сводная прибыль партнёров. */
export async function platformDashboard() {
  const partners = await listPartners();
  const totals = partners.reduce(
    (acc, p) => {
      acc.students += p.students;
      acc.branches += p.branches;
      acc.ourMonthlyIncome += p.monthlyBill;
      acc.partnersRevenue += p.revenue;
      acc.partnersExpenses += p.expenses;
      acc.partnersProfit += p.profit;
      return acc;
    },
    {
      partners: partners.length,
      students: 0,
      branches: 0,
      ourMonthlyIncome: 0,
      partnersRevenue: 0,
      partnersExpenses: 0,
      partnersProfit: 0,
    },
  );
  totals.currency = 'UZS';
  return { totals, pricing: getPricing(), partners };
}

// ---------- управление партнёром ----------

export async function setPartnerStatus(id, status) {
  const org = await repo.setOrgStatus(id, status);
  if (!org) throw new AppError(404, 'Partner not found');
  return { id: org.id, name: org.name, status: org.status };
}

// ---------- заявки с лендинга (leads) ----------

function mapLead(l) {
  return {
    id: l.id,
    name: l.name,
    phone: l.phone,
    centerName: l.center_name,
    centerSize: l.center_size,
    message: l.message,
    status: l.status,
    notes: l.notes,
    organizationId: l.organization_id,
    createdAt: l.created_at,
  };
}

/** Публичный приём заявки с лендинга. */
export async function submitLead(data) {
  const lead = await repo.insertLead(data);
  return { id: lead.id }; // наружу отдаём минимум (без утечки внутренних полей)
}

export async function listLeads(status) {
  const rows = await repo.listLeads(status);
  return rows.map(mapLead);
}

export async function updateLead(id, fields) {
  const lead = await repo.updateLead(id, fields);
  if (!lead) throw new AppError(404, 'Lead not found');
  return mapLead(lead);
}
