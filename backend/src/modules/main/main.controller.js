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
