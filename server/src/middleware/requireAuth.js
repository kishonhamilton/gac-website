/**
 * Server-side session + authorization checks.
 * All member-data routes must go through requireAuth. Role checks
 * happen here, not in the frontend, since the frontend can't be
 * trusted to enforce permissions.
 *
 * CURRENT STATUS: the Pushpay ChMS v1 API this site integrates with
 * (see ChurchManagementService.js) is a Basic-Auth service account
 * with no OAuth2/SSO flow, so there is currently no mechanism that
 * sets `gac_session` — every request to a route behind this
 * middleware will 401. The routes are left in place for a future
 * per-member identity solution (e.g. a separate login system that
 * maps to ChMS records), not because they're expected to work today.
 */
export function requireAuth(req, res, next) {
  const session = req.cookies?.gac_session;
  if (!session) {
    return res.status(401).json({ error: 'Please sign in with your church member account to continue.' });
  }
  // TODO: validate/decode the session, attach req.member = { id, roles }
  // once a real per-member session mechanism exists.
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const memberRoles = req.member?.roles || [];
    const authorized = allowedRoles.some((role) => memberRoles.includes(role));
    if (!authorized) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    next();
  };
}
