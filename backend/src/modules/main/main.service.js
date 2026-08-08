import argon2 from 'argon2';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { computeBill, tierForStudents, TIERS } from '../../config/plans.js';
import { genTempPassword } from '../auth/credentials.js';
import * as repo from './main.repository.js';

/**
 * Онбординг партнёра: создаём организацию + её SEO (бывш. Super Admin) одной транзакцией.
 * SEO получает временный пароль (показывается Main Admin'у один раз;
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

    let seo;
    try {
      seo = await repo.insertSeo(
        { orgId: org.id, ...admin, passwordHash },
        client,
      );
    } catch (err) {
      if (err.code === '23505') throw new AppError(409, 'Email already in use');
      throw err;
    }

    await repo.setOrgOwner(org.id, seo.id, client);

    // если онбордим из заявки — помечаем её onboarded и связываем с орг
    if (leadId) await repo.markLeadOnboarded(leadId, org.id, client);

    return {
      organization: org,
      seo: {
        id: seo.id,
        firstName: seo.first_name,
        lastName: seo.last_name,
        email: seo.email,
      },
      // показать один раз — Main Admin передаёт партнёру
      tempPassword,
    };
  });
}

/**
 * Что владелец платформы знает о партнёре.
 *
 * Граница простая: нам видно то, из чего считается НАШ счёт, и не видно то,
 * как партнёр зарабатывает. Число учеников — основание тарифа, поэтому оно
 * здесь. Оборот, расходы и прибыль партнёра убраны: это деньги чужого бизнеса,
 * и платформе они не нужны ни для биллинга, ни для поддержки.
 */
function decoratePartner(row) {
  const students = Number(row.students);
  const branches = Number(row.branches);
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

/** Платформенный дашборд: наш доход = сумма счетов партнёров. */
export async function platformDashboard() {
  const partners = await listPartners();
  // сводных partnersRevenue/Expenses/Profit здесь больше нет — см. decoratePartner
  const totals = partners.reduce(
    (acc, p) => {
      acc.students += p.students;
      acc.branches += p.branches;
      acc.ourMonthlyIncome += p.monthlyBill;
      return acc;
    },
    {
      partners: partners.length,
      students: 0,
      branches: 0,
      ourMonthlyIncome: 0,
    },
  );
  totals.currency = 'UZS';
  return { totals, pricing: getPricing(), partners };
}

/**
 * Выручка платформы (наш доход). Наш доход = сумма месячных счетов партнёров
 * (computeBill по числу учеников). Отдельный от дашборда endpoint, ориентированный
 * на деньги. Только чтение денежных данных — ничего не пишет.
 */
export async function platformRevenue() {
  const partners = await listPartners();
  const totals = partners.reduce(
    (acc, p) => {
      acc.ourMonthlyIncome += p.monthlyBill;
      acc.students += p.students;
      acc.branches += p.branches;
      if (p.status === 'active') acc.activePartners += 1;
      return acc;
    },
    {
      partners: partners.length,
      activePartners: 0,
      students: 0,
      branches: 0,
      ourMonthlyIncome: 0,
    },
  );
  totals.currency = 'UZS';
  return {
    totals,
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      tier: p.tier,
      students: p.students,
      branches: p.branches,
      monthlyBill: p.monthlyBill,
      // createdAt нужен карточке партнёра («активен N дней»). Без него фронт
      // считал дни от Invalid Date и печатал «Активен NaN дн.» — поймано
      // при живой проверке 2026-07-26, когда Revenue.jsx перевели с дашборда сюда.
      createdAt: p.createdAt,
    })),
    pricing: getPricing(),
  };
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

// ---------- объявления платформы (Main Admin → «Анонсы») ----------

function mapAnnouncement(a) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    targetType: a.target_type,
    recipientCount: Number(a.recipient_count),
    readCount: 0, // пометок «прочитано» в системе нет — то же, что в super
    senderName: a.sender_name ?? null,
    readers: [],
    nonReaders: [],
    createdAt: a.created_at,
  };
}

export async function listAnnouncements() {
  const items = (await repo.listAnnouncements()).map(mapAnnouncement);
  return { items, announcements: items, total: items.length };
}

/**
 * Адресаты — партнёры и их владельцы, то есть сотрудники. Привязки к Telegram
 * у сотрудников нет (`telegram_accounts` заполняется только для student/parent),
 * поэтому в очередь уведомлений НЕ кладём: воркер всё равно не нашёл бы chat_id
 * и задание молча пропало бы. Объявление живёт как запись в панели.
 */
export async function createAnnouncement(senderId, { title, body, targetType }) {
  const recipientCount = await repo.countAnnouncementRecipients(targetType);
  const row = await repo.insertAnnouncement({ senderId, title, body, targetType, recipientCount });
  return mapAnnouncement(row);
}

export async function deleteAnnouncement(id) {
  const row = await repo.softDeleteAnnouncement(id);
  if (!row) throw new AppError(404, 'Announcement not found');
  return { id: row.id };
}

// ---------- профиль main_admin ----------

function mapProfile(u) {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
  };
}

export async function getProfile(userId) {
  const user = await repo.findUserById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return mapProfile(user);
}

export async function updateProfile(userId, fields) {
  if (fields.email !== undefined && (await repo.emailTakenByOther(fields.email, userId))) {
    throw new AppError(409, 'Email already in use');
  }
  if (fields.phone !== undefined && (await repo.phoneTakenByOther(fields.phone, userId))) {
    throw new AppError(409, 'Phone already in use');
  }
  const user = await repo.updateProfile(userId, fields);
  if (!user) throw new AppError(404, 'User not found');
  return mapProfile(user);
}

/* Обзор штрафов по всем партнёрам убран намеренно.
 *
 * Он показывал, кого из сотрудников партнёра наказали, за что, на какую сумму
 * и кто выписал — то есть внутреннюю кадровую историю чужой организации.
 * Платформе это не нужно: по матрице CAN_ISSUE (discipline.service.js)
 * main_admin не выписывает штрафы никому, а дисциплина сотрудников — дело
 * SEO филиала. Соответствующий экран живёт в панели SEO,
 * где есть и просмотр, и выписывание: GET/POST /api/super/penalties. */
