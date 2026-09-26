<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DayChips from './components/DayChips.vue';
import DayWeekToggle from './components/DayWeekToggle.vue';
import Search from './components/Search.vue';
import LessonsGrid from './components/LessonsGrid.vue';
import { DateTime, Settings } from 'luxon';
Settings.defaultZone = 'Europe/Tallinn';

// Constants
const DAY_LETTERS = ['E', 'T', 'K', 'N', 'R', 'L', 'P']; // Mon-Sun

// Snapshot of the Edupage timetable, written by scripts/fetch-edupage.ts at deploy time.
const DATA_URL = `${import.meta.env.BASE_URL}data/`;
const STORAGE_KEY = 'tahvel.selection';

// state
let index = ref(null);
let weekIdx = ref(0);
let weekData = ref(null);
let day = ref(null);
let displayType = ref('week');
let searchValue = ref('');
let options = ref([]);
let selectedSearch = ref(null);
let loadError = ref('');
const weekCache = {};

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

// Computed
let week = computed(() => index.value?.weeks[weekIdx.value] ?? null);
let monday = computed(() => (week.value ? DateTime.fromISO(week.value.monday) : DateTime.now().startOf('week')));
let isCurrentWeek = computed(() => monday.value.hasSame(DateTime.now(), 'week'));
let todayIdx = computed(() => DateTime.now().weekday - 1);

let chips = computed(() =>
  Array.from({ length: 7 }, (_, i) => ({
    day: i,
    date: monday.value.plus({ days: i }).toFormat('dd.MM'),
    letter: DAY_LETTERS[i],
  })),
);

let weekRange = computed(() => `${monday.value.toFormat('dd.MM')} - ${monday.value.plus({ days: 6 }).toFormat('dd.MM')}`);

let updated = computed(() => (index.value ? DateTime.fromISO(index.value.generated).toFormat('dd.MM HH:mm') : ''));

let lessons = computed(() => {
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

/** This week if it is published, otherwise the nearest week that is. */
function currentWeekIdx(weeks) {
  const thisMonday = DateTime.now().startOf('week').toISODate();
  const exact = weeks.findIndex((w) => w.monday === thisMonday);
  if (exact >= 0) return exact;
  const next = weeks.findIndex((w) => w.monday > thisMonday);
  return next >= 0 ? next : weeks.length - 1;
}

onMounted(async () => {
  try {
    index.value = await getJson('index.json');
  } catch (e) {
    loadError.value = 'Tunniplaani andmeid ei õnnestunud laadida.';
    return;
  }
  weekIdx.value = currentWeekIdx(index.value.weeks);
  restoreSelection();
  loadWeek();
});

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
</script>
<template>
  <div class="mx-auto max-w-[900px] p-4">
    <header class="flex items-center gap-2.5">
      <div class="size-7 rounded-lg bg-linear-135 from-primary to-cyan-500" aria-hidden="true"></div>
      <h1 class="text-lg font-bold">Tunniplaan</h1>
    </header>

    <div class="mt-3 grid grid-cols-[auto_auto] justify-between gap-2.5 md:grid-cols-[1fr_auto_auto] md:justify-stretch">
      <Search class="col-span-full md:col-span-1" :searchValue="searchValue" @update="autocomplete" @selected="select" :options="options" @clear="clearSearch"></Search>
      <div class="flex items-center gap-1.5 text-sm whitespace-nowrap text-base-content/60">
        <button class="btn btn-circle btn-ghost btn-sm" :disabled="weekIdx <= 0" @click="shiftWeek(-1)" aria-label="Eelmine nädal">‹</button>
        <span :class="{ 'font-semibold text-base-content': isCurrentWeek }">{{ weekRange }}</span>
        <button class="btn btn-circle btn-ghost btn-sm" :disabled="!index || weekIdx >= index.weeks.length - 1" @click="shiftWeek(1)" aria-label="Järgmine nädal">›</button>
      </div>
      <DayWeekToggle :current="displayType" @toggle="toggle"></DayWeekToggle>
    </div>

    <DayChips :chips="chips" @choose="setDay" :day="day"></DayChips>
    <LessonsGrid :lessons="lessons"></LessonsGrid>
    <div class="mt-2.5 rounded-box border border-dashed border-neutral p-3.5 text-center text-base-content/60" v-if="loadError || !selectedSearch || (weekData && !lessons.length)">
      <template v-if="loadError">{{ loadError }}</template>
      <template v-else-if="!selectedSearch">Vali õpperühm või õpetaja, et näha tunniplaani.</template>
      <template v-else>{{ displayType === 'week' ? 'Sel nädalal pole tunde.' : 'Sel päeval pole tunde.' }}</template>
    </div>

    <footer class="mt-6 mb-2 text-center text-xs text-base-content/60" v-if="index">
      Andmed: <a class="link link-secondary" :href="index.source" target="_blank" rel="noopener">Edupage</a>, uuendatud {{ updated }}
    </footer>
  </div>
</template>
