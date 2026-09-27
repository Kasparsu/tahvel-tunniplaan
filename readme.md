# Tunniplaan

Mobile-friendly timetable for Techno TLN: search a group or a teacher, see the day or the
week, and step between the weeks the school has published. Installable as an app (PWA) and
readable offline.

The campuses keep their timetables in different systems, and the app merges them so one
search covers all of them:

| Campus | Group codes | Timetable |
|---|---|---|
| Kesklinn | `K-…` | [Edupage](https://kesklinn-techno.edupage.org/timetable/) |
| Mustamäe | `M-…` | [Edupage](https://mustamae-techno.edupage.org/timetable/) |
| Järve | `J-…` | [Tahvel, school 24](https://tahveltp.edu.ee/#/schoolBoard/24) |
| Lasnamäe | `L-…` | Tahvel, school 24 |

Groups and teachers do move between campuses, so each lesson's campus comes from its room when
that says (Tahvel's building, a campus-lettered room code like `M-A138`, or Kesklinn's
placeholder rooms named after a campus), then from which Edupage it is in, then from its group
code. Free periods use that campus's bell times, and a group or teacher at several campuses gets
the campus on each lesson card.

Neither system sends CORS headers, so the browser cannot read them directly. Instead
`scripts/fetch-timetable.ts` (with one module per system in `scripts/providers/`) takes a
snapshot into `public/data/`: `index.json` plus one merged JSON file per week, from last week
on. The site reads those static files. The deploy workflow runs the fetch before every build
and on a schedule (every 30 minutes on school days), so the site stays current without commits.

```bash
bun install
bun run fetch      # snapshot every source into public/data/
bun run dev        # http://localhost:5173/
bun run build && bun run preview
```

Merging: a lesson entered in two systems (Kesklinn's Edupage with the room "Lasnamäe", Tahvel
with the real room) is kept once, with the real room. Teachers who appear in several sources are matched by name regardless of word order
(Tahvel's "First Last" is stored as Edupage's "Last First"), and Mustamäe's surname-only
teachers are matched to the one full name starting with that surname. Tahvel's 45-minute events
are joined into double lessons, and its bell schedule is read off the event times.

Edupage's school servers drop connections from some GitHub Actions IPs, so the deploy workflow
fetches through a Cloudflare Worker (`worker/`, deploy with `bun run worker:deploy`) that only
relays the timetable endpoints above.

Selections saved by the earlier Tahvel-based version are carried over by name.

GitHub switches off scheduled workflows in a repository with no activity for 60 days;
re-enable it on the Actions tab (or push anything) if the data stops updating.
