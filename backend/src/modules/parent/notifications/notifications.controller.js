import { asyncHandler } from '../../../utils/asyncHandler.js';
import * as service from './notifications.service.js';

/** GET /notifications — лента уведомлений (оценки/посещаемость/платежи) по всем детям родителя. */
export const list = asyncHandler(async (req, res) => {
  const data = await service.listForParent(req.user.id);
  res.json({ success: true, data });
});
