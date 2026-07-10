import argon2 from 'argon2';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { computeBill } from '../../config/plans.js';
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

function decoratePartner(row, pricing) {
  const students = Number(row.students);
  const branches = Number(row.branches);
  return {
    id: row.id,
    name: row.name,
    plan: row.plan,
    domain: row.domain,
    status: row.status,
    createdAt: row.created_at,
    branches,
    students,
    monthlyBill: computeBill(pricing, { students, branches }), // сколько партнёр платит нам (сумы)
  };
}

// ---------- цены платформы ----------

export function getPricing() {
  return repo.getPricing();
}

export async function updatePricing(fields) {
  return repo.updatePricing(fields);
}

export async function listPartners() {
  const [rows, pricing] = await Promise.all([repo.listPartners(), repo.getPricing()]);
  return rows.map((row) => decoratePartner(row, pricing));
}

/** Платформенный дашборд: наш доход = сумма счетов партнёров. */
export async function platformDashboard() {
  const partners = await listPartners();
  const totals = partners.reduce(
    (acc, p) => {
      acc.students += p.students;
      acc.branches += p.branches;
      acc.ourMonthlyIncome += p.monthlyBill;
      return acc;
    },
    { partners: partners.length, students: 0, branches: 0, ourMonthlyIncome: 0 },
  );
  const pricing = await repo.getPricing();
  totals.currency = pricing?.currency ?? 'UZS';
  // прибыль каждого партнёра (его доход − расход) появится, когда будут платежи (K-ADMIN)
  return { totals, pricing, partners };
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
