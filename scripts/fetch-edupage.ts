/**
 * Snapshot the Techno TLN Kesklinn timetable from Edupage into static JSON.
 *
 * Edupage sends no CORS headers, so the browser cannot ask it directly. Instead this runs
 * in the deploy workflow (on a schedule) and writes public/data/, which Vite copies into
 * the site: index.json lists the published weeks and everything searchable, and
 * week-<monday>.json holds that week's lessons with times already resolved.
 *
 * Only weeks the school has published (hidden: false) are fetched.
 *
 *   bun scripts/fetch-edupage.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

const SCHOOL = process.env.EDUPAGE_SCHOOL ?? "kesklinn-techno";
const SERVER = `https://${SCHOOL}.edupage.org/timetable/server`;
const OUT = new URL("../public/data/", import.meta.url).pathname;

async function call<T>(script: string, func: string, args: unknown[]): Promise<T> {
  const res = await fetch(`${SERVER}/${script}?__func=${func}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ __args: args, __gsh: "00000000" }),
  });
  if (!res.ok) throw new Error(`${func}: HTTP ${res.status}`);
  const body = (await res.json()) as { r?: T };
  if (!body.r) throw new Error(`${func}: empty response`);
  return body.r;
}

/** Edupage's school year starts in August ("schoolyear_turnover": "08-01"). */
function schoolYear(now = new Date()): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/** The Monday inside the week that starts on `datefrom` (published weeks start on Sunday). */
function mondayOf(datefrom: string): string {
  const d = new Date(`${datefrom}T12:00:00Z`);
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

type Row = Record<string, any>;

interface Lesson {
  day: number; // 0 = Monday
  start: string;
  end: string;
  subject: string;
  classes: string[];
  groups: string[]; // empty = whole class
  teachers: string[];
  rooms: string[];
}

function week(r: Row): { lessons: Lesson[]; classes: string[]; teachers: string[] } {
  const T: Record<string, Row[]> = Object.fromEntries(r.dbiAccessorRes.tables.map((t: Row) => [t.id, t.data_rows]));
  const byId = (name: string) => new Map((T[name] ?? []).map((x) => [x.id, x]));
  const periods = byId("periods");
  const subjects = byId("subjects");
  const classes = byId("classes");
  const teachers = byId("teachers");
  const groups = byId("groups");
  const rooms = byId("classrooms");
  const lessonsById = byId("lessons");
  const clean = (s: unknown) => String(s ?? "").replace(/ /g, " ").trim();

  const out: Lesson[] = [];
  for (const card of T.cards ?? []) {
    // Unplaced cards have no period and no day.
    if (!card.period || !card.days) continue;
    const lesson = lessonsById.get(card.lessonid);
    if (!lesson) continue;
    const first = Number(card.period);
    const last = first + Math.max(1, Number(lesson.durationperiods) || 1) - 1;
    const startP = periods.get(String(first));
    const endP = periods.get(String(last)) ?? startP;
    if (!startP) continue;
    const day = String(card.days).indexOf("1");
    if (day < 0) continue;
    out.push({
      day,
      start: startP.starttime,
      end: endP!.endtime,
      subject: clean(subjects.get(lesson.subjectid)?.name),
      classes: (lesson.classids ?? []).map((id: string) => clean(classes.get(id)?.short)).filter(Boolean),
      groups: (lesson.groupids ?? [])
        .map((id: string) => groups.get(id))
        .filter((g: Row | undefined) => g && !g.entireclass)
        .map((g: Row) => clean(g.name)),
      teachers: (lesson.teacherids ?? []).map((id: string) => clean(teachers.get(id)?.name)).filter(Boolean),
      rooms: (card.classroomids ?? []).map((id: string) => clean(rooms.get(id)?.short)).filter(Boolean),
    });
  }
  out.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start) || a.classes.join().localeCompare(b.classes.join()));
  return {
    lessons: out,
    classes: [...classes.values()].map((c) => clean(c.short)).filter(Boolean),
    teachers: [...teachers.values()].map((t) => clean(t.name)).filter(Boolean),
  };
}

const year = Number(process.env.EDUPAGE_YEAR ?? schoolYear());
const viewer = await call<Row>("ttviewer.js", "getTTViewerData", [null, year]);
const published = (viewer.regular?.timetables ?? []).filter((t: Row) => !t.hidden);
if (!published.length) throw new Error(`no published timetables for ${year}`);

mkdirSync(OUT, { recursive: true });
const weeks = [];
const classes = new Set<string>();
const teachers = new Set<string>();
for (const t of published) {
  const data = week(await call<Row>("regulartt.js", "regularttGetData", [null, t.tt_num]));
  const monday = mondayOf(t.datefrom);
  const file = `week-${monday}.json`;
  writeFileSync(`${OUT}${file}`, JSON.stringify({ monday, name: t.text, lessons: data.lessons }));
  data.classes.forEach((c) => classes.add(c));
  data.teachers.forEach((c) => teachers.add(c));
  weeks.push({ monday, name: t.text, file, lessons: data.lessons.length });
  console.log(`${monday}  ${t.text}  ${data.lessons.length} lessons`);
}
weeks.sort((a, b) => a.monday.localeCompare(b.monday));
const sortEt = (a: string, b: string) => a.localeCompare(b, "et");
writeFileSync(
  `${OUT}index.json`,
  JSON.stringify({
    source: `https://${SCHOOL}.edupage.org/timetable/`,
    generated: new Date().toISOString(),
    weeks,
    classes: [...classes].sort(sortEt),
    teachers: [...teachers].sort(sortEt),
  }),
);
console.log(`${weeks.length} weeks, ${classes.size} classes, ${teachers.size} teachers -> ${OUT}`);
