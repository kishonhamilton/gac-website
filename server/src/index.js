import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import eventsRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// Allow the configured production site, plus ANY localhost/127.0.0.1 dev
// origin regardless of port — the static frontend and this API run on
// different ports locally, and different tools default to different
// ports (python's http.server: 8080, VS Code Live Server: 5500, etc.),
// so same-origin doesn't apply until a production rewrite puts them
// under one domain.
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === process.env.NEXT_PUBLIC_SITE_URL || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
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

// Contact and visitor forms are CCB iframe embeds (see contact.html,
// plan-your-visit.html) — no backend route needed for them.
app.use('/api', eventsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Central error handler — never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
});

app.listen(PORT, () => {
  console.log(`GAC website API listening on port ${PORT}`);
});
