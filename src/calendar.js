/**
 * Calendar feeds. The worker (worker/src/ics.ts) serves one group's or teacher's lessons as
 * iCalendar, so a calendar app can subscribe to the URL and follow the timetable as it changes
 * instead of holding a copy that goes stale.
 */

// The same worker the deploy relays its fetches through (see .github/workflows/deploy.yml).
const FEED = 'https://tahvel-edupage-proxy.kasparsu.workers.dev/ics';

/** What anyone would put in their own calendar; rooms get no feed. */
const KINDS = ['group', 'teacher'];
export const canSubscribe = (sel) => !!sel && KINDS.includes(sel.type);

export const feedUrl = ({ type, name }) => `${FEED}/${type}/${encodeURIComponent(name)}.ics`;

/** webcal: hands the feed straight to whichever calendar app the device has. */
export const webcalUrl = (sel) => feedUrl(sel).replace(/^https:/, 'webcal:');

/** Google Calendar's "add by URL" screen, which many phones reach more reliably than webcal:. */
export const googleUrl = (sel) => `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(sel))}`;
