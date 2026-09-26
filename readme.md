# Tunniplaan

Mobile-friendly timetable for Techno TLN Kesklinn: search a group or a teacher, see the
day or the week, and step between the weeks the school has published.

The data comes from the school's Edupage timetable
(https://kesklinn-techno.edupage.org/timetable/). Edupage sends no CORS headers, so the
browser cannot read it directly. Instead `scripts/fetch-edupage.ts` takes a snapshot
into `public/data/` (one JSON file per published week plus `index.json`), and the site
reads those static files. The deploy workflow runs the fetch before every build and on a
schedule (every 30 minutes on school days), so the published site stays current without
commits.

```bash
bun install
bun run fetch      # snapshot Edupage into public/data/
bun run dev        # http://localhost:5173/
bun run build && bun run preview
```

Only weeks the school has published are fetched (Edupage marks the rest hidden).
Selections saved by the earlier Tahvel-based version are carried over by name.

GitHub switches off scheduled workflows in a repository with no activity for 60 days;
re-enable it on the Actions tab (or push anything) if the data stops updating.
