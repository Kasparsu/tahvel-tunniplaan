/**
 * Lessons as the rows the timetable lists: one per lesson, with free periods ("Vaba") before the
 * first lesson of a day and between lessons (not after the last), from the bell times of the campus
 * the next lesson is at. Used by the timetable and by the kiosk's "today" screens.
 */
import { DateTime } from 'luxon';

export const DAY_LETTERS = ['E', 'T', 'K', 'N', 'R', 'L', 'P']; // Mon-Sun
export const DAY_NAMES = ['Esmaspäev', 'Teisipäev', 'Kolmapäev', 'Neljapäev', 'Reede', 'Laupäev', 'Pühapäev'];

/** Bell periods lying wholly between `from` and `to`, back-to-back ones merged (08:30-09:15 + 09:15-10:00 = one block). */
function freeBlocks(periods, from, to) {
  const blocks = [];
  for (const p of periods) {
    if (p.start < from || p.end > to) continue;
    const last = blocks.at(-1);
    if (last?.end === p.start) last.end = p.end;
    else blocks.push({ start: p.start, end: p.end });
  }
  return blocks;
}

/** A note about one date ("25.09 iseseisva õppe päev") belongs only on that day's lessons; undated notes on all. */
function noteFor(note, date) {
  const m = note?.match(/^(\d{1,2})\.(\d{1,2})\b/);
  if (!m) return note;
  return Number(m[1]) === date.day && Number(m[2]) === date.month ? note : undefined;
}

/**
 * lessons     one selection's lessons, in day and time order
 * type        what was selected ('group', 'teacher', 'room'): its own field is left off the rows
 * monday      the week's Monday (luxon DateTime)
 * periods     the week's bell times per campus
 * showFree    insert free periods
 * tintToday   mark today's rows (the week list does)
 * campusLabel lesson → the campus name to show on its row, or ''
 */
export function lessonRows({ lessons, type, monday, periods = {}, showFree = true, tintToday = false, campusLabel = () => '' }) {
  const periodsOf = (l) => periods[l.campus] ?? [];
  const withFree = [];
  let cursor = { day: -1 };
  for (const l of lessons) {
    if (l.day !== cursor.day) cursor = { day: l.day, end: periodsOf(l)[0]?.start ?? l.start };
    const free = showFree ? freeBlocks(periodsOf(l), cursor.end, l.start) : [];
    for (const b of free) withFree.push({ day: l.day, ...b, free: true });
    withFree.push(l);
    if (l.end > cursor.end) cursor.end = l.end;
  }

  return withFree.map((l) => {
    const date = monday.plus({ days: l.day });
    const row = {
      day: DAY_LETTERS[l.day],
      dayName: DAY_NAMES[l.day],
      date: date.toFormat('dd.MM'),
      time: { start: l.start, end: l.end },
      isToday: tintToday && date.hasSame(DateTime.now(), 'day'),
    };
    if (l.free) return { ...row, free: true };
    return {
      ...row,
      name: l.subject,
      room: l.rooms.join(', '),
      group: [...l.classes, ...l.groups].join(' '),
      teacher: l.teachers.join(', '),
      note: noteFor(l.note, date),
      campus: campusLabel(l),
      // each row leaves out what was searched for: a group's names the teacher, a room's the group and teacher
      showGroup: type !== 'group',
      showTeacher: type !== 'teacher',
      showRoom: type !== 'room',
    };
  });
}
