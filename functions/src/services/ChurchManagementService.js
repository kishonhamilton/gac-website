/**
 * ChurchManagementService
 * ------------------------------------------------------------------
 * The ONLY place in this codebase that talks to Church Community
 * Builder (CCB) / Pushpay ChMS. Nothing else — no route, no frontend
 * code — should call CCB directly. This keeps credentials in one
 * place and lets you swap or upgrade the integration without
 * touching the rest of the app.
 *
 * AUTH MODEL (confirmed against
 * https://docs.pushpay.io/chms-v1/docs/getting-started): this API
 * uses HTTP Basic Auth with a single API username/password issued
 * from ChMS's own API Admin section — a service-account credential
 * for server-to-server data access, NOT an individual member's
 * personal login. There is no OAuth2/SSO flow for this API, so this
 * service can pull church-wide data (events, groups, ministries,
 * announcements) but cannot authenticate an individual site visitor
 * as a specific member. "Member Login" on this site is, and stays,
 * a redirect to the church's own ChMS login page — see routes/auth.js.
 *
 * STATUS: `getEvents` and `getGroups` are wired up for real (confirmed
 * against https://docs.pushpay.io/chms-v1/reference/). `getMinistries`
 * reuses group_profiles, since ChMS models ministries as groups
 * classified by department/type — confirm this mapping against real
 * data once you can see how this church's ministries are structured
 * in ChMS. `getAnnouncements` has no confirmed equivalent service in
 * the reference index and stays a NotImplementedError rather than
 * guessing at one.
 *
 * Every not-yet-implemented method throws NotImplementedError, and
 * every route that calls it is expected to catch that and fall back
 * to a "temporarily unavailable" message (see routes/member.js)
 * rather than fabricating data.
 * ------------------------------------------------------------------
 */

import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

class NotImplementedError extends Error {
  constructor(method) {
    super(
      `ChurchManagementService.${method}() is not yet wired up to a real CCB/ChMS endpoint. ` +
        `Confirm the exact "srv" name and response shape against the Pushpay ChMS v1 API ` +
        `reference, then implement it here.`
    );
    this.name = 'NotImplementedError';
  }
}

export class ChurchManagementService {
  constructor({ apiUrl, username, password } = {}) {
    this.apiUrl = apiUrl || process.env.CCB_API_URL;
    this.username = username || process.env.CCB_API_USERNAME;
    this.password = password || process.env.CCB_API_PASSWORD;

    if (!this.apiUrl || !this.username || !this.password) {
      // Fail loudly in dev rather than silently pointing at nothing.
      console.warn(
        '[ChurchManagementService] CCB_API_URL / CCB_API_USERNAME / CCB_API_PASSWORD are not ' +
          'fully set. All calls will fail until configured.'
      );
    }
  }

  /**
   * Low-level call against api.php?srv=<service>. Every public method
   * above should go through this rather than calling fetch() directly.
   * Parses the XML envelope and throws on the API's own in-band error
   * format: <error number="002" type="...">message</error> as a direct
   * child of <response> (confirmed against docs/xml).
   */
  async _call(srv, params = {}) {
    if (!this.apiUrl || !this.username || !this.password) {
      throw new Error('CCB API is not configured — set CCB_API_URL, CCB_API_USERNAME, CCB_API_PASSWORD.');
    }
    const url = new URL(this.apiUrl);
    url.searchParams.set('srv', srv);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      throw new Error(`CCB API request failed: ${res.status} ${res.statusText}`);
    }

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const response = parsed?.ccb_api?.response;
    if (response?.error) {
      const err = response.error;
      const code = err['@_number'];
      const type = err['@_type'];
      const message = typeof err === 'object' ? err['#text'] : err;
      throw new Error(`CCB API error ${code} (${type}): ${message}`);
    }
    return response;
  }

  /**
   * Fetch approved public events in a date range via public_calendar_listing.
   * `opts.dateStart`/`opts.dateEnd` should be 'YYYY-MM-DD' strings.
   * dateStart defaults to today; dateEnd defaults to +90 days.
   */
  async getEvents(opts = {}) {
    const today = new Date();
    const dateStart = opts.dateStart || today.toISOString().slice(0, 10);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 90);
    const dateEnd = opts.dateEnd || defaultEnd.toISOString().slice(0, 10);

    const response = await this._call('public_calendar_listing', {
      date_start: dateStart,
      date_end: dateEnd,
    });
    const items = response?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  /** Fetch group listings via group_profiles. `campusId` optionally filters by campus. */
  async getGroups({ campusId } = {}) {
    const response = await this._call('group_profiles', {
      include_participants: false,
      campus_id: campusId,
    });
    const groups = response?.groups?.group;
    if (!groups) return [];
    return Array.isArray(groups) ? groups : [groups];
  }

  /**
   * Ministry listings — reuses group_profiles. ChMS has no separate
   * "ministry" concept; ministries are typically groups classified by
   * department/type. Confirm this mapping against real data before
   * relying on it — it may need filtering by a specific department
   * once you can see this church's actual group classification.
   */
  async getMinistries() {
    return this.getGroups();
  }

  /**
   * No confirmed announcements service exists in the Pushpay ChMS v1
   * reference index — this stays unimplemented rather than guessing.
   */
  async getAnnouncements() {
    throw new NotImplementedError('getAnnouncements');
  }
}

// Singleton instance used across routes.
export const churchManagementService = new ChurchManagementService();
