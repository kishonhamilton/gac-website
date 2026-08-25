import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

function validateSubmission(body) {
  const errors = [];
  if (!body.firstName?.trim()) errors.push('First name is required.');
  if (!body.lastName?.trim()) errors.push('Last name is required.');
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('A valid email is required.');
  return errors;
}

/**
 * POST /api/contact
 * POST /api/visitor
 * Both accept the same shape. In production, forward to email and/or
 * to CCB as a new contact/visitor record via ChurchManagementService,
 * once that capability is confirmed available on the church's plan.
 */
function handleSubmission(kind) {
  return (req, res) => {
    const errors = validateSubmission(req.body || {});
    if (errors.length) {
      return res.status(400).json({ error: errors.join(' ') });
    }

    // TODO: send email notification and/or push to CCB as a contact.
    console.log(`[${kind} submission]`, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      // Avoid logging full email/phone/message in plaintext logs long-term;
      // route to a proper mail/CRM system instead.
    });

    res.status(200).json({ ok: true, message: 'Thank you — your message has been received.' });
  };
}

router.post('/contact', formLimiter, handleSubmission('contact'));
router.post('/visitor', formLimiter, handleSubmission('visitor'));

export default router;
