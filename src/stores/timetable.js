import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { DateTime, Settings } from 'luxon';
Settings.defaultZone = 'Europe/Tallinn';

// Constants
const DAY_LETTERS = ['E', 'T', 'K', 'N', 'R', 'L', 'P']; // Mon-Sun

// Snapshot of the Edupage timetable, written by scripts/fetch-edupage.ts at deploy time.
const DATA_URL = `${import.meta.env.BASE_URL}data/`;
const STORAGE_KEY = 'tahvel.selection';

// Helpers
const words = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const sameWords = (a, b) => words(a).sort().join(' ') === words(b).sort().join(' ');
const matches = (query, name) => {
  const have = words(name);
  const compact = (s) => words(s).join('');
  // "ta24a" should find "K-TA-24A", "suursalu" should find "Suursalu Kaspar Martin"
  return words(query).every((q) => have.some((w) => w.startsWith(q))) || compact(name).includes(compact(query));
};

async function getJson(file) {
  const response = await fetch(`${DATA_URL}${file}`);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.json();
}

/** This week if it is published, otherwise the nearest week that is. */
function currentWeekIdx(weeks) {
  const thisMonday = DateTime.now().startOf('week').toISODate();
  const exact = weeks.findIndex((w) => w.monday === thisMonday);
  if (exact >= 0) return exact;
  const next = weeks.findIndex((w) => w.monday > thisMonday);
  return next >= 0 ? next : weeks.length - 1;
}

export const useTimetableStore = defineStore('timetable', () => {
  // state
  const index = ref(null);
  const weekIdx = ref(0);
  const weekData = ref(null);
  const day = ref(null);
  const displayType = ref('week');
  const searchValue = ref('');
  const options = ref([]);
  const selectedSearch = ref(null);
  const loadError = ref('');
  const weekCache = {};

  // Computed
  const week = computed(() => index.value?.weeks[weekIdx.value] ?? null);
  const monday = computed(() => (week.value ? DateTime.fromISO(week.value.monday) : DateTime.now().startOf('week')));
  const isCurrentWeek = computed(() => monday.value.hasSame(DateTime.now(), 'week'));
  const todayIdx = computed(() => DateTime.now().weekday - 1);
  const hasPrevWeek = computed(() => weekIdx.value > 0);
  const hasNextWeek = computed(() => !!index.value && weekIdx.value < index.value.weeks.length - 1);

  const chips = computed(() =>
    Array.from({ length: 7 }, (_, i) => ({
      day: i,
      date: monday.value.plus({ days: i }).toFormat('dd.MM'),
      letter: DAY_LETTERS[i],
    })),
  );

  const weekRange = computed(() => `${monday.value.toFormat('dd.MM')} - ${monday.value.plus({ days: 6 }).toFormat('dd.MM')}`);

  const updated = computed(() => (index.value ? DateTime.fromISO(index.value.generated).toFormat('dd.MM HH:mm') : ''));

  const lessons = computed(() => {
    const sel = selectedSearch.value;
    if (!sel || !weekData.value) return [];
    let list = weekData.value.lessons.filter((l) =>
      sel.type === 'teacher' ? l.teachers.includes(sel.name) : l.classes.includes(sel.name),
    );
    if (displayType.value === 'today') list = list.filter((l) => l.day === todayIdx.value);
    if (displayType.value === 'day') list = list.filter((l) => l.day === day.value);
    return list.map((l) => {
      const date = monday.value.plus({ days: l.day });
      return {
        day: DAY_LETTERS[l.day],
        date: date.toFormat('dd.MM'),
        time: { start: l.start, end: l.end },
        name: l.subject,
        room: l.rooms.join(', '),
        group: [...l.classes, ...l.groups].join(' '),
        teacher: l.teachers.join(', '),
        showGroup: sel.type === 'teacher',
        isToday: displayType.value === 'week' && date.hasSame(DateTime.now(), 'day'),
      };
    });
  });

  const emptyMessage = computed(() => {
    if (loadError.value) return loadError.value;
    if (!selectedSearch.value) return 'Vali õpperühm või õpetaja, et näha tunniplaani.';
    if (weekData.value && !lessons.value.length) return displayType.value === 'week' ? 'Sel nädalal pole tunde.' : 'Sel päeval pole tunde.';
    return '';
  });

  // Loading
  async function loadWeek() {
    if (!week.value) return;
    const file = week.value.file;
    weekCache[file] ??= getJson(file);
    try {
      weekData.value = await weekCache[file];
    } catch (e) {
      delete weekCache[file];
      loadError.value = 'Tunniplaani laadimine ebaõnnestus.';
    }
  }

  watch(weekIdx, () => {
    weekData.value = null;
    loadWeek();
  });

  async function init() {
    try {
      index.value = await getJson('index.json');
    } catch (e) {
      loadError.value = 'Tunniplaani andmeid ei õnnestunud laadida.';
      return;
    }
    weekIdx.value = currentWeekIdx(index.value.weeks);
    restoreSelection();
    loadWeek();
  }

  // Selection
  function restoreSelection() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      saved = null;
    }
    if (!saved?.name) return;
    // Selections saved by the old Tahvel version store Tahvel's spelling
    // ("Kaspar Martin Suursalu"); Edupage has "Suursalu Kaspar Martin". Same words, so match on those.
    const pool = saved.type === 'teacher' ? index.value.teachers : index.value.classes;
    const name = pool.find((n) => n === saved.name) ?? pool.find((n) => sameWords(n, saved.name));
    if (name) select({ type: saved.type, name });
    else localStorage.removeItem(STORAGE_KEY);
  }

  function autocomplete(value) {
    if (!index.value || String(value).trim().length < 2) {
      options.value = [];
      return;
    }
    const hit = (type) => (name) => ({ id: `${type}:${name}`, name, type });
    const teachers = index.value.teachers.filter((n) => matches(value, n)).map(hit('teacher'));
    const groups = index.value.classes.filter((n) => matches(value, n)).map(hit('group'));
    // a space usually means a person's name, otherwise a group code
    options.value = (value.includes(' ') ? [...teachers, ...groups] : [...groups, ...teachers]).slice(0, 30);
  }

  function select(selected) {
    if (!selected) return;
    selectedSearch.value = { type: selected.type, name: selected.name };
    searchValue.value = selected.name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSearch.value));
    options.value = [];
  }

  function clearSearch() {
    selectedSearch.value = null;
    searchValue.value = '';
    options.value = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  // Navigation
  function toggle(type) {
    day.value = null;
    if (type === 'today') weekIdx.value = currentWeekIdx(index.value?.weeks ?? []);
    displayType.value = type;
  }

  function setDay(d) {
    day.value = d; // 0=Mon ... 6=Sun
    displayType.value = 'day';
  }

  function shiftWeek(step) {
    const next = weekIdx.value + step;
    if (!index.value || next < 0 || next >= index.value.weeks.length) return;
    weekIdx.value = next;
    if (displayType.value === 'today') displayType.value = 'week';
  }

  return {
    index, weekIdx, weekData, day, displayType, searchValue, options, selectedSearch, loadError,
    isCurrentWeek, hasPrevWeek, hasNextWeek, chips, weekRange, updated, lessons, emptyMessage,
    init, autocomplete, select, clearSearch, toggle, setDay, shiftWeek,
  };
});
