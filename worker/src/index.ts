/**
 * Relay for the two Edupage timetable endpoints scripts/fetch-edupage.ts calls:
 * POST /timetable/server/{ttviewer,regulartt}.js?__func=... is forwarded to the school's
 * Edupage and the answer passed back. Anything else is a 404, so this is not an open proxy.
 */
const UPSTREAM = "https://kesklinn-techno.edupage.org";
const ALLOWED_PATHS = new Set(["/timetable/server/ttviewer.js", "/timetable/server/regulartt.js"]);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || !ALLOWED_PATHS.has(url.pathname)) {
      return new Response("Not found", { status: 404 });
    }
    const upstream = await fetch(`${UPSTREAM}${url.pathname}${url.search}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: await request.text(),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  },
};
