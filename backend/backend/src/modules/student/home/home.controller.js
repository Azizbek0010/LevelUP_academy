import { asyncHandler } from '../../../utils/asyncHandler.js';
import * as homeService from './home.service.js';

/** GET /home — дашборд текущего студента. */
export const getDashboard = asyncHandler(async (req, res) => {
  const data = await homeService.getDashboard(req.user);
  res.json({ success: true, data });
});
