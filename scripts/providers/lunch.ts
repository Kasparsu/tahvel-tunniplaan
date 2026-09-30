/**
 * School lunch menus from https://techno.ee/opilasele/koolilouna/: one tab per campus, each with its
 * weeks, days and dishes. The campuses write their menus differently: Mustamäe lists shared sections
 * ("Koolilõuna", "Lisaroog"), Kesklinn, Lasnamäe and Järve a choice of meals ("Vali üks…") plus what
 * goes with all of them. The markup is not always well-formed (a week left open swallows the next
 * ones, a week can appear twice, a day's leftover test entry beside the real one), so days are read
 * on their own and told apart by their date, the fuller one of a date kept.
 */
import { parse, type HTMLElement } from "node-html-parser";
import { clean, type Campus } from "./types";

export interface Dish {
  name: string;
  ingredients?: string;
  allergens?: string;
  amount?: string; // "180 g"
  kcal?: string; // "217"
}
export interface LunchSection {
  title: string; // "Põhitoit (valik I)", "Kõigi valikute juurde", "Koolilõuna"
  choice: boolean; // one of the meals to pick from, rather than served with every meal
  dishes: Dish[];
}
export interface LunchDay {
  date: string; // ISO
  intro?: string; // "Vali üks põhitoit:", or on a day without lunch the page's own words
  sections: LunchSection[];
  closed?: boolean; // no lunch that day ("Koolilõunat ei pakuta."), rather than no menu published
}
export interface CampusLunch {
  days: LunchDay[];
  notes: string[];
  legend: string[]; // "G – sisaldab gluteeni"
}

const text = (el: HTMLElement | null | undefined) => clean(el?.text.replace(/\s+/g, " "));
/** "Allergeenid: 1; 2" → "1; 2" */
const labelled = (dish: HTMLElement, label: string) => {
  const p = dish.querySelectorAll(".tlmk-menu__ingredients").find((x) => text(x).startsWith(label));
  return p ? text(p).slice(label.length).replace(/^:\s*/, "") || undefined : undefined;
};

function dish(el: HTMLElement): Dish {
  const facts = el.querySelectorAll(".tlmk-menu__facts span").map(text);
  const fact = (name: string) => facts.find((f) => f.startsWith(name))?.slice(name.length).trim();
  return {
    name: text(el.querySelector("h4")),
    ingredients: labelled(el, "Koostisosad"),
    allergens: labelled(el, "Allergeenid"),
    amount: fact("Kogus"),
    kcal: fact("Energia")?.replace(/\s*kcal$/, ""),
  };
}

const section = (el: HTMLElement, choice: boolean): LunchSection => ({
  title: text(el.querySelector(".tlmk-menu__group")),
  choice,
  dishes: el.querySelectorAll(".tlmk-menu__dish").map(dish),
});

/** "28.09.2026" → "2026-09-28" */
const isoDate = (d: string) => {
  const m = d.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};

function day(el: HTMLElement): LunchDay | null {
  const date = isoDate(text(el.querySelector(".tlmk-menu__date")));
  const body = el.querySelector(".tlmk-menu__day-body");
  if (!date || !body) return null;
  const sections: LunchSection[] = [];
  let note: string | undefined; // the kitchen's own words ("Vali üks: põhitoit, taimetoit või supp koos magustoiduga.")
  let pick: string | undefined; // the page's ("Vali üks põhitoit:")
  // only the day's own parts: a malformed page can nest other days inside
  for (const part of body.childNodes.filter((n): n is HTMLElement => n.nodeType === 1)) {
    const cls = part.getAttribute("class") ?? "";
    if (cls.includes("tlmk-menu__choices")) sections.push(...part.querySelectorAll(".tlmk-menu__choice").map((c) => section(c, true)));
    else if (cls.includes("tlmk-menu__shared")) sections.push(section(part, false));
    else if (cls.includes("tlmk-menu__choice-intro")) pick = text(part);
    else if (cls.includes("tlmk-menu__ingredients")) note = text(part);
  }
  if (sections.length) return { date, intro: note ?? pick, sections };
  // A day can be listed only to say there is no lunch. Keep it: dropping it made the app fall back
  // to another day's menu, as if that were today's.
  const message = text(body);
  return message ? { date, intro: message, sections: [], closed: true } : null;
}

const dishCount = (d?: LunchDay) => d?.sections.reduce((n, s) => n + s.dishes.length, 0) ?? 0;

/** The menus of the campuses named in the page's tabs, from `fromDate` on. */
export async function fetchLunch(url: string, campuses: Record<Campus, string>, fromDate: string): Promise<Partial<Record<Campus, CampusLunch>>> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { "user-agent": "tahvel-tunniplaan (+https://kasparsu.github.io/tahvel-tunniplaan/)" } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const root = parse(await res.text());
  const tabs = root.querySelectorAll('[role="tab"]').map(text);
  const panels = root.querySelectorAll('[role="tabpanel"]');
  const byName = Object.fromEntries(Object.entries(campuses).map(([code, name]) => [name, code as Campus]));
  const out: Partial<Record<Campus, CampusLunch>> = {};
  panels.forEach((panel, i) => {
    const campus = byName[tabs[i]];
    if (!campus) return;
    const days = new Map<string, LunchDay>();
    for (const el of panel.querySelectorAll(".tlmk-menu__day")) {
      const d = day(el);
      // a date listed twice keeps the fuller entry; a real menu beats a "no lunch" line
      if (d && d.date >= fromDate && (!days.has(d.date) || dishCount(d) > dishCount(days.get(d.date)))) days.set(d.date, d);
    }
    out[campus] = {
      days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
      notes: panel.querySelectorAll(".tlmk-menu__notes li").map(text).filter(Boolean),
      legend: panel.querySelectorAll(".tlmk-menu__legend-items span").map(text).filter(Boolean),
    };
  });
  if (!Object.keys(out).length) throw new Error(`${url}: no campus menus found (page layout changed?)`);
  return out;
}
