import { Router } from 'express';

const router = Router();

/**
 * GET /api/auth/login
 *
 * Entry point for the "Member Login" button.
 *
 * The Pushpay ChMS v1 API (see ChurchManagementService.js) is a
 * Basic-Auth service account with no OAuth2/SSO flow — it can pull
 * church-wide data, but it cannot authenticate an individual site
 * visitor as a specific member. So this route always redirects to
 * the church's own ChMS login page. CCB/ChMS remains the sole
 * authentication authority; this site never sees or stores a
 * member's password.
 */
router.get('/login', (req, res) => {
  const ccbLoginUrl = process.env.CCB_DIRECT_LOGIN_URL;
  if (!ccbLoginUrl) {
    return res.status(500).json({
      error: 'CCB_DIRECT_LOGIN_URL is not configured. Set it to the church ChMS portal login page.',
    });
  }
  return res.redirect(ccbLoginUrl);
});

export default router;
