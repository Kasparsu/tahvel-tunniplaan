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

/**
 * Google Calendar's "add by URL" dialog, opened empty for the link to be pasted into. It is not
 * handed the feed: calendar.google.com/calendar/r?cid=<feed> refuses an https address with "Unable to
 * add this URL", and takes a webcal: one only sometimes, while that field accepts a pasted https
 * address reliably.
 */
export const GOOGLE_ADD_URL = 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';
