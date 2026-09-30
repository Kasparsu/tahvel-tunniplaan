import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { DateTime, Settings } from 'luxon';
import { DAY_LETTERS, lessonRows } from '../lessonRows';
Settings.defaultZone = 'Europe/Tallinn';

// Snapshot of every campus's timetable (Edupage and Tahvel), written by scripts/fetch-timetable.ts at deploy time.
const DATA_URL = `${import.meta.env.BASE_URL}data/`;
const STORAGE_KEY = 'tahvel.selection';
const SETTINGS_KEY = 'tahvel.settings';
const FILTERS_KEY = 'tahvel.freeFilters';
const NO_FILTERS = {
  seats: null, // at least this many student seats
  computers: '', // '' any room, 'any' a computer class, or a platform: 'windows', 'mac'
  equipment: [], // all of these: 'projector', 'interactive_display', 'television', 'whiteboard', 'chalkboard'
};
const DEFAULT_SETTINGS = {
  showFree: true, // "Vaba" cards for free periods
  hideEmptyDays: false, // day chips only for days with lessons
};

function loadFreeFilters() {
  try {
    return { ...structuredClone(NO_FILTERS), ...JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}') };
  } catch {
    return structuredClone(NO_FILTERS);
  }
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

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

// the lesson field a selection of each type is looked up in
const FIELD = { group: 'classes', teacher: 'teachers', room: 'rooms' };
const lessonsFor = (sel, lessons) => lessons.filter((l) => l[FIELD[sel.type]].includes(sel.name));
/** index.json's list of groups, teachers or rooms */
const poolFor = (index, type) => (type === 'teacher' ? index.teachers : type === 'room' ? index.rooms : index.classes) ?? [];

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
  const settings = ref(loadSettings());
  watch(settings, (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)), { deep: true });
  // 'timetable' (a group's, teacher's or room's lessons) or 'rooms' (rooms free at a time)
  const mode = ref('timetable');
  const freeCampus = ref('K');
  const freeDay = ref(0);
  const freeSlot = ref(null); // start time of the bell period looked at, or 'now'
  const freeFilters = ref(loadFreeFilters());
  watch(freeFilters, (f) => localStorage.setItem(FILTERS_KEY, JSON.stringify(f)), { deep: true });
  // the clock "Praegu" looks at; ticks so the free-room list follows the time
  const nowTime = ref(DateTime.now().toFormat('HH:mm'));
  setInterval(() => (nowTime.value = DateTime.now().toFormat('HH:mm')), 30_000);

  // Computed
  const week = computed(() => index.value?.weeks[weekIdx.value] ?? null);
  const monday = computed(() => (week.value ? DateTime.fromISO(week.value.monday) : DateTime.now().startOf('week')));
  const isCurrentWeek = computed(() => monday.value.hasSame(DateTime.now(), 'week'));
  const todayIdx = computed(() => DateTime.now().weekday - 1);
  const showingToday = computed(
    () => displayType.value === 'today' || (displayType.value === 'day' && isCurrentWeek.value && day.value === todayIdx.value),
  );
  const hasPrevWeek = computed(() => weekIdx.value > 0);
  const hasNextWeek = computed(() => !!index.value && weekIdx.value < index.value.weeks.length - 1);

  const chips = computed(() => {
    const all = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      date: monday.value.plus({ days: i }).toFormat('dd.MM'),
      letter: DAY_LETTERS[i],
    }));
    // with "hide days without lessons", only the selection's days; free rooms always get the whole week
    const sel = selectedSearch.value;
    if (!settings.value.hideEmptyDays || mode.value !== 'timetable' || !sel || !weekData.value) return all;
    const days = new Set(lessonsFor(sel, weekData.value.lessons).map((l) => l.day));
    return all.filter((c) => days.has(c.day));
  });

  const weekRange = computed(() => `${monday.value.toFormat('dd.MM')} - ${monday.value.plus({ days: 6 }).toFormat('dd.MM')}`);

  const updated = computed(() => (index.value ? DateTime.fromISO(index.value.generated).toFormat('dd.MM HH:mm') : ''));
  const sources = computed(() => index.value?.sources ?? []);
  const campusName = (c) => index.value?.campuses?.[c] ?? c;
  /** Campuses the selected group or teacher has lessons at; cards name the campus when there are several. */
  const selectedCampuses = computed(() => {
    const sel = selectedSearch.value;
    if (!sel || !index.value) return [];
    return poolFor(index.value, sel.type).find((e) => e.name === sel.name)?.campuses ?? [];
  });

  const lessons = computed(() => {
    const sel = selectedSearch.value;
    if (!sel || !weekData.value) return [];
    let list = lessonsFor(sel, weekData.value.lessons);
    // when today is past the published weeks, the nearest week is not this week and has no "today"
    if (displayType.value === 'today') list = isCurrentWeek.value ? list.filter((l) => l.day === todayIdx.value) : [];
    if (displayType.value === 'day') list = list.filter((l) => l.day === day.value);

    return lessonRows({
      lessons: list,
      type: sel.type,
      monday: monday.value,
      periods: weekData.value.periods,
      showFree: settings.value.showFree,
      tintToday: displayType.value === 'week',
      // a selection at several campuses names the campus on each row
      campusLabel: (l) => (selectedCampuses.value.length > 1 && l.campus ? campusName(l.campus) : ''),
    });
  });

  // Free rooms ------------------------------------------------------------------------------

  const campuses = computed(() => Object.entries(index.value?.campuses ?? {}).map(([id, name]) => ({ id, name })));
  /** The looked-at campus's bell periods this week; the ones the free-room search offers. */
  const freePeriods = computed(() => weekData.value?.periods?.[freeCampus.value] ?? []);
  const freeIsToday = computed(() => isCurrentWeek.value && freeDay.value === todayIdx.value);
  /** The time span looked at: a bell period, or for 'now' the current minute (so breaks work too). */
  const freePeriod = computed(() => {
    if (freeSlot.value === 'now') {
      if (!freeIsToday.value) return null;
      const next = DateTime.fromFormat(nowTime.value, 'HH:mm').plus({ minutes: 1 }).toFormat('HH:mm');
      return { start: nowTime.value, end: next, now: true };
    }
    return freePeriods.value.find((p) => p.start === freeSlot.value) ?? null;
  });

  /**
   * Rooms of the campus with no lesson overlapping the chosen period, and until when each stays
   * free that day. Only what the timetables show: other bookings, and rooms no lesson uses, are unknown.
   */
  const freeRoomsAll = computed(() => {
    const period = freePeriod.value;
    if (!period || !weekData.value || !index.value) return [];
    const dayLessons = weekData.value.lessons.filter((l) => l.day === freeDay.value);
    return (index.value.rooms ?? [])
      .filter((r) => r.campuses.includes(freeCampus.value))
      .map((r) => {
        const inRoom = dayLessons.filter((l) => l.rooms.includes(r.name));
        if (inRoom.some((l) => l.start < period.end && l.end > period.start)) return null;
        const next = inRoom.filter((l) => l.start >= period.end).sort((a, b) => a.start.localeCompare(b.start))[0];
        return { name: r.name, until: next?.start ?? null, info: r.info ?? null };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'et', { numeric: true }));
  });

  // Filters work on the room details a campus publishes (seats, computers, equipment); only Kesklinn has them so far.
  const freeHasInfo = computed(() => (index.value?.rooms ?? []).some((r) => r.info && r.campuses.includes(freeCampus.value)));
  const freeFiltersActive = computed(() => {
    const f = freeFilters.value;
    return !!(f.seats || f.computers || f.equipment.length);
  });
  function matchesFilters(info) {
    const f = freeFilters.value;
    if (f.seats && info.seats < f.seats) return false;
    if (f.computers === 'any' && !info.computers) return false;
    if (f.computers && f.computers !== 'any' && !info.platforms.includes(f.computers)) return false;
    return f.equipment.every((e) => info.equipment.includes(e));
  }
  /** Free rooms passing the filters; with a filter on, rooms without details cannot be checked and are left out. */
  const freeRooms = computed(() =>
    freeHasInfo.value && freeFiltersActive.value ? freeRoomsAll.value.filter((r) => r.info && matchesFilters(r.info)) : freeRoomsAll.value,
  );
  /** Free rooms a filter left out only because their details are unknown. */
  const freeRoomsUnknown = computed(() => (freeHasInfo.value && freeFiltersActive.value ? freeRoomsAll.value.filter((r) => !r.info).length : 0));
  function toggleFreeEquipment(e) {
    const list = freeFilters.value.equipment;
    freeFilters.value.equipment = list.includes(e) ? list.filter((x) => x !== e) : [...list, e];
  }
  function resetFreeFilters() {
    freeFilters.value = structuredClone(NO_FILTERS);
  }

  /** Right now when looking at today, else the day's first bell period. */
  function currentSlot() {
    return freeIsToday.value ? 'now' : (freePeriods.value[0]?.start ?? null);
  }

  /** Open the free-room search on now: this week, today, the current period, the selection's campus. */
  function showFreeRooms() {
    mode.value = 'rooms';
    if (selectedCampuses.value.length) freeCampus.value = selectedCampuses.value[0];
    const current = currentWeekIdx(index.value?.weeks ?? []);
    if (weekIdx.value !== current) weekIdx.value = current;
    freeDay.value = isCurrentWeek.value ? todayIdx.value : 0;
    freeSlot.value = currentSlot(); // null until the week's bell periods have loaded, then the watch picks one
  }

  /** "Praegu": back to this week and today, at the current minute. */
  function showFreeNow() {
    const current = currentWeekIdx(index.value?.weeks ?? []);
    if (weekIdx.value !== current) weekIdx.value = current;
    freeDay.value = todayIdx.value;
    freeSlot.value = 'now';
  }

  // keep something valid picked as the campus, day or week (and so the bells) change
  watch([freePeriods, freeDay, freeIsToday], () => {
    const valid = freeSlot.value === 'now' ? freeIsToday.value : freePeriods.value.some((p) => p.start === freeSlot.value);
    if (!valid) freeSlot.value = currentSlot();
  });

  function setFreeCampus(c) {
    freeCampus.value = c;
  }

  /** From a free room to its timetable. */
  function openRoom(name) {
    mode.value = 'timetable';
    select({ type: 'room', name });
  }

  /** Day chips pick the free-room day in that mode, the timetable's day otherwise. */
  function chooseDay(d) {
    if (mode.value === 'rooms') freeDay.value = d;
    else setDay(d);
  }
  const activeDay = computed(() => (mode.value === 'rooms' ? freeDay.value : day.value));

  const emptyMessage = computed(() => {
    if (loadError.value) return loadError.value;
    if (!selectedSearch.value) return 'Vali õpperühm, õpetaja või ruum, et näha tunniplaani.';
    if (weekData.value && !lessons.value.length) return displayType.value === 'week' ? 'Sel nädalal pole tunde.' : 'Sel päeval pole tunde.';
    return '';
  });

  // Loading
  function fetchWeek(file) {
    weekCache[file] ??= getJson(file).catch((e) => {
      delete weekCache[file];
      throw e;
    });
    return weekCache[file];
  }

  async function loadWeek() {
    if (!week.value) return;
    try {
      weekData.value = await fetchWeek(week.value.file);
    } catch (e) {
      loadError.value = 'Tunniplaani laadimine ebaõnnestus.';
    }
  }

  /**
   * Open the day of the selection's next lesson that has not ended yet: today if lessons remain, else a later day or week.
   * Resolves false when there is nothing to show, leaving the view as it was.
   */
  async function showNextLessons() {
    const sel = selectedSearch.value;
    if (!sel) return false;
    const weeks = index.value?.weeks ?? [];
    const now = DateTime.now();
    for (let i = currentWeekIdx(weeks); i < weeks.length; i++) {
      let data;
      try {
        data = await fetchWeek(weeks[i].file);
      } catch {
        return false;
      }
      if (selectedSearch.value !== sel) return true; // user picked something else meanwhile, leave the view alone
      const monday = DateTime.fromISO(weeks[i].monday);
      const ends = (l) => DateTime.fromISO(`${monday.plus({ days: l.day }).toISODate()}T${l.end}`);
      const next = lessonsFor(sel, data.lessons)
        .filter((l) => ends(l) > now)
        .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))[0];
      if (next) {
        weekIdx.value = i;
        setDay(next.day);
        return true;
      }
    }
    return false;
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
    const pool = poolFor(index.value, saved.type).map((e) => e.name);
    const name = pool.find((n) => n === saved.name) ?? pool.find((n) => sameWords(n, saved.name));
    if (name) select({ type: saved.type, name });
    else localStorage.removeItem(STORAGE_KEY);
  }

  function autocomplete(value) {
    if (!index.value || String(value).trim().length < 2) {
      options.value = [];
      return;
    }
    const hit = (type) => (e) => ({ id: `${type}:${e.name}`, name: e.name, type, campuses: e.campuses.map(campusName) });
    const find = (type) => poolFor(index.value, type).filter((e) => matches(value, e.name)).map(hit(type));
    const [groups, teachers, rooms] = ['group', 'teacher', 'room'].map(find);
    // a space usually means a person's name, otherwise a group or room code
    options.value = (value.includes(' ') ? [...teachers, ...groups, ...rooms] : [...groups, ...rooms, ...teachers]).slice(0, 30);
  }

  function select(selected) {
    if (!selected) return;
    selectedSearch.value = { type: selected.type, name: selected.name };
    searchValue.value = selected.name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSearch.value));
    options.value = [];
    showNextLessons();
  }

  function clearSearch() {
    selectedSearch.value = null;
    searchValue.value = '';
    options.value = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  // Navigation
  async function toggle(type) {
    // "Täna" jumps ahead to the next lessons when today has none left
    if (type === 'today' && (await showNextLessons())) return;
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
    index, weekIdx, weekData, day, displayType, searchValue, options, selectedSearch, loadError, settings,
    isCurrentWeek, showingToday, hasPrevWeek, hasNextWeek, chips, weekRange, updated, sources, lessons, emptyMessage,
    init, autocomplete, select, clearSearch, toggle, setDay, shiftWeek,
    mode, campuses, freeCampus, freeDay, freeSlot, freePeriods, freePeriod, freeRooms, activeDay,
    freeFilters, freeHasInfo, freeFiltersActive, freeRoomsUnknown, toggleFreeEquipment, resetFreeFilters,
    showFreeRooms, showFreeNow, setFreeCampus, openRoom, chooseDay,
  };
});
