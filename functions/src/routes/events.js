import { Router } from 'express';
import { churchManagementService } from '../services/ChurchManagementService.js';

const router = Router();

function toText(field) {
  if (field == null) return '';
  if (typeof field === 'object') return field['#text'] || '';
  return String(field);
}

function toId(field) {
  if (field && typeof field === 'object' && field['@_ccb_id'] != null) {
    return String(field['@_ccb_id']);
  }
  return '';
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * GET /api/events — public, no login required.
 *
 * Pulls upcoming events from CCB's public_calendar_listing (see
 * ChurchManagementService.getEvents) and reshapes them for the
 * frontend. Deliberately strips leader_phone / leader_email — the
 * raw CCB response includes a leader's personal contact info, which
 * has no business being sent to an unauthenticated public endpoint.
 * Optional query params: date_start, date_end ('YYYY-MM-DD').
 */
router.get('/events', async (req, res) => {
  try {
    const events = await churchManagementService.getEvents({
      dateStart: req.query.date_start,
      dateEnd: req.query.date_end,
    });

    const shaped = events
      .map((e) => ({
        id: toId(e.event_name),
        title: toText(e.event_name),
        date: e.date,
        startTime: e.start_time,
        endTime: e.end_time,
        location: e.location || '',
        description: stripHtml(e.event_description),
        eventType: e.event_type || '',
        groupName: toText(e.group_name),
        leaderName: toText(e.leader_name),
        // leader_phone / leader_email intentionally omitted — never
        // expose personal contact info on this public endpoint.
      }))
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

    res.json({ events: shaped });
  } catch (err) {
    console.error('[events API]', err.message);
    res.status(502).json({ error: 'Event listings are temporarily unavailable. Please try again shortly.' });
  }
});

export default router;
