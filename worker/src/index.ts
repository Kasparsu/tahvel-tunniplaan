/**
 * Relay for the timetable requests scripts/fetch-timetable.ts makes, for deploys running on
 * GitHub Actions IPs that Edupage drops. Only these are forwarded; anything else is a 404, so
 * this is not an open proxy:
 *
 *   POST /edupage/<school>/timetable/server/{ttviewer,regulartt}.js?...  ->  https://<school>.edupage.org/...
 *   GET  /tahvel/hois_back/timetableevents/timetableSearch?...           ->  https://tahveltp.edu.ee/...
 */
const EDUPAGE_SCHOOLS = new Set(["kesklinn-techno", "mustamae-techno"]);
const EDUPAGE_PATHS = new Set(["/timetable/server/ttviewer.js", "/timetable/server/regulartt.js"]);
const TAHVEL_PATHS = new Set(["/hois_back/timetableevents/timetableSearch"]);

function target(request: Request): string | null {
  const url = new URL(request.url);
  const [, kind, ...rest] = url.pathname.split("/");
  if (kind === "edupage" && request.method === "POST") {
    const [school, ...path] = rest;
    const p = `/${path.join("/")}`;
    if (EDUPAGE_SCHOOLS.has(school) && EDUPAGE_PATHS.has(p)) return `https://${school}.edupage.org${p}${url.search}`;
  }
  if (kind === "tahvel" && request.method === "GET") {
    const p = `/${rest.join("/")}`;
    if (TAHVEL_PATHS.has(p)) return `https://tahveltp.edu.ee${p}${url.search}`;
  }
  return null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const to = target(request);
    if (!to) return new Response("Not found", { status: 404 });
    const upstream = await fetch(to, {
      method: request.method,
      headers: { "content-type": "application/json" },
      body: request.method === "POST" ? await request.text() : undefined,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  },
};
