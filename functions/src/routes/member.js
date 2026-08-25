import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { churchManagementService } from '../services/ChurchManagementService.js';

// NOTE: the Pushpay ChMS v1 API (see ChurchManagementService.js) is a
// shared Basic-Auth service account, not per-member OAuth — it has no
// concept of "the currently authenticated member" or an access token.
// These routes stay behind requireAuth for when a real per-member
// identity mechanism exists; until then they 401 (see requireAuth.js).
// There is intentionally no /profile route — a shared service account
// can't resolve "my profile" without knowing which member is asking.
//
// Events are NOT here — they're public (see routes/events.js), since
// public_calendar_listing is meant to be shown to anyone. Groups and
// ministries data includes leader/coach personal contact info and
// membership counts, so it stays gated here rather than exposed
// publicly, even though this middleware can't currently pass.

const router = Router();
router.use(requireAuth);

async function proxy(res, fn) {
  try {
    const data = await fn();
    res.json(data);
  } catch (err) {
    console.error('[member API]', err.message);
    res.status(502).json({
      error: 'Church member services are temporarily unavailable. Please try again shortly, or access your member account directly.',
    });
  }
}

router.get('/groups', (req, res) => proxy(res, () => churchManagementService.getGroups()));
router.get('/announcements', (req, res) => proxy(res, () => churchManagementService.getAnnouncements()));

export default router;
