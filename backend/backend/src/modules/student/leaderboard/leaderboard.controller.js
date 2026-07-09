import { asyncHandler } from '../../../utils/asyncHandler.js';
import { getLeaderboard } from '../../leaderboard/leaderboard.service.js';

/** GET /leaderboard?period=week|month — топ филиала + позиция текущего студента. */
export const getMyLeaderboard = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const data = await getLeaderboard(req.user.branchId, period, { limit: 20, studentId: req.user.id });
  res.json({ success: true, data });
});
