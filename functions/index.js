import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import contactRoutes from './src/routes/contact.js';
import eventsRoutes from './src/routes/events.js';

// Sensitive values only — set with:
//   firebase functions:secrets:set CCB_API_USERNAME
//   firebase functions:secrets:set CCB_API_PASSWORD
// Non-secret config (CCB_API_URL) is read from functions/.env — see
// functions/.env.example.
const ccbApiUsername = defineSecret('CCB_API_USERNAME');
const ccbApiPassword = defineSecret('CCB_API_PASSWORD');

const app = express();

app.use(helmet());

// Same-origin in production via the Hosting rewrite (/api/** -> this
// function), so CORS is mostly a local-dev/emulator convenience here.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
  })
);

// Hosting rewrites preserve the original path, so routes keep the
// same /api/* prefix as the standalone server/ Express app.
// Member login is a direct link to CCB's own login page (no OAuth/SSO
// exists on this ChMS plan — see README.md) — no backend route needed.
app.use('/api', contactRoutes);
app.use('/api', eventsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Central error handler — never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
});

export const api = onRequest({ secrets: [ccbApiUsername, ccbApiPassword] }, app);
