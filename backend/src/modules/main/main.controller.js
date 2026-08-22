import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './main.service.js';

export const onboardPartner = asyncHandler(async (req, res) => {
  const result = await service.onboardPartner(req.body);
  res.status(201).json(result);
});

export const listPartners = asyncHandler(async (_req, res) => {
  res.json({ partners: await service.listPartners() });
});

export const dashboard = asyncHandler(async (_req, res) => {
  res.json(await service.platformDashboard());
});

export const revenue = asyncHandler(async (_req, res) => {
  res.json(await service.platformRevenue());
});

export const getPricing = asyncHandler(async (_req, res) => {
  res.json({ pricing: await service.getPricing() });
});

export const updatePricing = asyncHandler(async (req, res) => {
  res.json({ pricing: await service.updatePricing(req.body) });
});

// --- управление партнёром ---
export const setPartnerStatus = asyncHandler(async (req, res) => {
  res.json({ partner: await service.setPartnerStatus(req.params.id, req.body.status) });
});

// --- каталог платных фич ---
export const listAddonPrices = asyncHandler(async (_req, res) => {
  res.json({ features: await service.listAddonPrices() });
});

export const createAddonFeature = asyncHandler(async (req, res) => {
  res.status(201).json({ feature: await service.createAddonFeature(req.body, req.user.id) });
});

export const updateAddonFeature = asyncHandler(async (req, res) => {
  res.json({ feature: await service.updateAddonFeature(req.params.key, req.body) });
});

export const deactivateAddonFeature = asyncHandler(async (req, res) => {
  res.json({ feature: await service.deactivateAddonFeature(req.params.key) });
});

// --- фичи партнёра ---
export const getPartnerFeatures = asyncHandler(async (req, res) => {
  res.json(await service.getPartnerFeatures(req.params.id));
});

export const setPartnerFeature = asyncHandler(async (req, res) => {
  res.json({ flag: await service.setFeatureFlag(req.params.id, req.params.key, req.body.enabled, req.user.id) });
});

// --- биллинг партнёра ---
export const recordPayment = asyncHandler(async (req, res) => {
  res.status(201).json({ payment: await service.recordPayment(req.params.id, req.body, req.user.id) });
});

export const grantBonus = asyncHandler(async (req, res) => {
  res.json(await service.grantBonus(req.params.id, req.body.months, req.user.id));
});

export const listOrgLedger = asyncHandler(async (req, res) => {
  res.json({ ledger: await service.listOrgLedger(req.params.id) });
});

// --- собственные расходы платформы ---
export const listExpenses = asyncHandler(async (_req, res) => {
  res.json({ expenses: await service.listExpenses() });
});

export const createExpense = asyncHandler(async (req, res) => {
  res.status(201).json({ expense: await service.createExpense(req.body, req.user.id) });
});

export const videoStorageCosts = asyncHandler(async (_req, res) => {
  res.json(await service.videoStorageCosts());
});

export const deleteExpense = asyncHandler(async (req, res) => {
  res.json(await service.deleteExpense(req.params.id));
});

export const finance = asyncHandler(async (_req, res) => {
  res.json(await service.platformFinance());
});

// --- заявки SEO на подключение/отключение фичи ---
export const listFeatureRequests = asyncHandler(async (req, res) => {
  res.json({ requests: await service.listFeatureRequests(req.query.status) });
});

export const decideFeatureRequest = asyncHandler(async (req, res) => {
  res.json({ request: await service.decideFeatureRequest(req.params.id, req.body.decision, req.user.id) });
});

// --- заявки с лендинга ---
export const submitLead = asyncHandler(async (req, res) => {
  // публичный endpoint — наружу только id
  res.status(201).json(await service.submitLead(req.body));
});

export const listLeads = asyncHandler(async (req, res) => {
  res.json({ leads: await service.listLeads(req.query.status) });
});

export const updateLead = asyncHandler(async (req, res) => {
  res.json({ lead: await service.updateLead(req.params.id, req.body) });
});

// --- объявления платформы ---
export const listAnnouncements = asyncHandler(async (_req, res) => {
  res.json(await service.listAnnouncements());
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createAnnouncement(req.user.id, req.body));
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  res.json(await service.deleteAnnouncement(req.params.id));
});

// --- профиль ---
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await service.getProfile(req.user.id) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ profile: await service.updateProfile(req.user.id, req.body) });
});

// дисциплина сотрудников — зона SEO (/api/super/penalties), не платформы
