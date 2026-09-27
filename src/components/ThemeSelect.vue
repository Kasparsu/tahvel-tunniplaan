<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { getTimes } from 'suncalc';
import ChipSelect from './ChipSelect.vue';
import EDITOR_THEMES from '../themes/editor.json';

const label = (t) => t[0].toUpperCase() + t.slice(1).replace('-', ' ');
// daisyUI's built-in themes enabled in src/style.css, and which of them are dark
const DAISY_THEMES = ['light', 'dark', 'dim', 'cupcake', 'emerald', 'corporate', 'retro', 'synthwave', 'dracula', 'sunset', 'black'];
const DAISY_DARK = new Set(['dark', 'dim', 'synthwave', 'dracula', 'sunset', 'black']);
const GROUPS = [
    {
        name: 'Tunniplaan',
        themes: [
            { id: 'techno', label: 'Techno', dark: false },
            { id: 'techno-dark', label: 'Techno dark', dark: true },
            { id: 'tunniplaan', label: 'Tunniplaan', dark: true },
        ],
    },
    { name: 'Koodiredaktorid', themes: EDITOR_THEMES },
    { name: 'daisyUI', themes: DAISY_THEMES.map((id) => ({ id, label: label(id), dark: DAISY_DARK.has(id) })) },
];
const ALL = GROUPS.flatMap((g) => g.themes);
const BY_ID = Object.fromEntries(ALL.map((t) => [t.id, t]));
const THEMES = ALL.map((t) => t.id);

// No saved theme means automatic: a light and a dark theme, switched by `source`:
// the device's preference ('system'), sunrise and sunset in Tallinn ('sun') or the light sensor ('sensor')
const AUTO = 'auto';
const STORAGE_KEY = 'tahvel.theme'; // also read by the inline script in index.html; absent means AUTO
const AUTO_KEY = 'tahvel.autoTheme'; // { light, dark, source, sun: { rise, set } }, also read by index.html
const COLOR_KEY = 'tahvel.themeColor'; // { theme, color } of the applied theme, for index.html's first paint
const AUTO_DEFAULT = { light: 'techno', dark: 'techno-dark', source: 'system' };
const SOURCES = ['system', 'sun', 'sensor'];

/** Any CSS colour (daisyUI's built-in themes use oklch) as #rrggbb, which every browser takes in theme-color. */
function toHex(color) {
    const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return '#' + [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const prefersDark = ref(darkQuery.matches);
const onSchemeChange = (e) => (prefersDark.value = e.matches);
darkQuery.addEventListener('change', onSchemeChange);
onUnmounted(() => darkQuery.removeEventListener('change', onSchemeChange));

const saved = localStorage.getItem(STORAGE_KEY);
if (saved && !THEMES.includes(saved)) localStorage.removeItem(STORAGE_KEY); // a theme that has since been removed
const theme = ref(THEMES.includes(saved) ? saved : AUTO);

/** The automatic pair, each falling back to the default if it is gone or of the wrong kind. */
function loadAuto() {
    let a = {};
    try {
        a = JSON.parse(localStorage.getItem(AUTO_KEY) || '{}');
    } catch {}
    // before sunrise/sunset switching this was a { sensor: true } on/off setting
    const source = SOURCES.includes(a.source) ? a.source : a.sensor ? 'sensor' : AUTO_DEFAULT.source;
    return {
        light: BY_ID[a.light]?.dark === false ? a.light : AUTO_DEFAULT.light,
        dark: BY_ID[a.dark]?.dark === true ? a.dark : AUTO_DEFAULT.dark,
        source,
    };
}
const auto = ref(loadAuto());
const lightOptions = ALL.filter((t) => !t.dark).map((t) => ({ value: t.id, label: t.label }));
const darkOptions = ALL.filter((t) => t.dark).map((t) => ({ value: t.id, label: t.label }));

// Light sensor (Generic Sensor API; few browsers expose it). Dark below DARK_LUX, light above LIGHT_LUX,
// in between keeps the current one, and a change has to hold for SETTLE_MS so a passing shadow does not flip it.
const DARK_LUX = 25;
const LIGHT_LUX = 60;
const SETTLE_MS = 3000;
const sensorSupported = typeof window !== 'undefined' && 'AmbientLightSensor' in window;
const sensorDark = ref(null); // null until a clear reading
const sensorError = ref('');
let sensor = null;
let candidate = null;
let candidateSince = 0;

function onReading() {
    const lux = sensor.illuminance;
    const reading = lux < DARK_LUX ? true : lux > LIGHT_LUX ? false : null;
    if (reading === null || reading === sensorDark.value) return void (candidate = null);
    if (sensorDark.value === null) return void (sensorDark.value = reading); // the first clear reading applies at once
    if (candidate !== reading) return void ((candidate = reading), (candidateSince = Date.now()));
    if (Date.now() - candidateSince >= SETTLE_MS) {
        sensorDark.value = reading;
        candidate = null;
    }
}

function startSensor() {
    sensorError.value = '';
    try {
        sensor = new window.AmbientLightSensor({ frequency: 1 });
        sensor.addEventListener('reading', onReading);
        sensor.addEventListener('error', (e) => {
            sensorError.value = e.error?.name === 'NotAllowedError' ? 'Valgusanduri kasutamine pole lubatud.' : 'Valgusandurit ei saa kasutada.';
            stopSensor();
        });
        sensor.start();
    } catch (e) {
        sensorError.value = e.name === 'SecurityError' ? 'Valgusanduri kasutamine pole lubatud.' : 'Valgusandurit ei saa kasutada.';
        sensor = null;
    }
}
function stopSensor() {
    sensor?.stop();
    sensor = null;
    sensorDark.value = null;
    candidate = null;
}
watch(() => sensorSupported && theme.value === AUTO && auto.value.source === 'sensor', (on) => (on ? startSensor() : stopSensor()), {
    immediate: true,
});
onUnmounted(stopSensor);

// Sunrise and sunset in Tallinn, computed on the device (works offline); across Estonia they differ by minutes.
const TALLINN = [59.437, 24.7536];
const clock = ref(Date.now());
const clockTimer = setInterval(() => (clock.value = Date.now()), 60_000);
onUnmounted(() => clearInterval(clockTimer));
const hhmm = (d) => d.toLocaleTimeString('et-EE', { timeZone: 'Europe/Tallinn', hour: '2-digit', minute: '2-digit' });
const sun = computed(() => {
    const t = getTimes(new Date(clock.value), ...TALLINN);
    return { rise: t.sunrise, set: t.sunset };
});
const sunDark = computed(() => clock.value < sun.value.rise.getTime() || clock.value >= sun.value.set.getTime());

/** Automatic is dark by its source; the light sensor goes by the device's preference until a clear reading. */
const autoDark = computed(() => {
    if (auto.value.source === 'sun') return sunDark.value;
    if (auto.value.source === 'sensor' && sensorDark.value !== null) return sensorDark.value;
    return prefersDark.value;
});

// saved with today's sun times, so index.html can pick the right theme before the app loads
watch([auto, sun], ([a, s]) => localStorage.setItem(AUTO_KEY, JSON.stringify({ ...a, sun: { rise: hhmm(s.rise), set: hhmm(s.set) } })), {
    deep: true,
    immediate: true,
});
const applied = computed(() => (theme.value === AUTO ? (autoDark.value ? auto.value.dark : auto.value.light) : theme.value));

watch(applied, (t) => {
    document.documentElement.dataset.theme = t;
    // match the browser/OS bar (installed app, mobile address bar) to the theme's background
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim();
    if (!bg) return;
    const color = toHex(bg);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    document.documentElement.style.backgroundColor = color;
    localStorage.setItem(COLOR_KEY, JSON.stringify({ theme: t, color }));
}, { immediate: true });
watch(theme, (t) => (t === AUTO ? localStorage.removeItem(STORAGE_KEY) : localStorage.setItem(STORAGE_KEY, t)));
</script>
<template>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Teema">
        <button :data-theme="theme === AUTO ? applied : auto.light" role="radio" :aria-checked="theme === AUTO" @click="theme = AUTO"
            class="col-span-full rounded-box border-2 bg-base-100 p-2.5 text-left text-base-content"
            :class="theme === AUTO ? 'border-primary' : 'border-base-300'">
            <div class="flex items-center justify-between text-sm font-semibold">
                Automaatne
                <span v-if="theme === AUTO" class="text-primary" aria-hidden="true">✓</span>
            </div>
            <div class="mt-0.5 text-xs opacity-60">
                {{ BY_ID[auto.light].label }} või {{ BY_ID[auto.dark].label }},
                vastavalt {{ { system: 'seadme seadistusele', sun: 'päikesetõusule ja -loojangule', sensor: 'valgusandurile' }[auto.source] }}
            </div>
            <div class="mt-1.5 flex gap-1">
                <!-- dots take their colours from each theme of the pair -->
                <span :data-theme="auto.light" class="size-3.5 rounded-full bg-primary"></span>
                <span :data-theme="auto.light" class="size-3.5 rounded-full bg-secondary"></span>
                <span :data-theme="auto.dark" class="size-3.5 rounded-full bg-primary"></span>
                <span :data-theme="auto.dark" class="size-3.5 rounded-full bg-base-100 ring-1 ring-base-content/20"></span>
            </div>
        </button>
        <!-- the automatic pair and what switches between them -->
        <div v-if="theme === AUTO" class="col-span-full grid gap-2 rounded-box border border-base-300 p-3">
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm">Hele teema</span>
                <ChipSelect v-model="auto.light" :options="lightOptions" label="Hele teema" align="right" class="w-48"></ChipSelect>
            </div>
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm">Tume teema</span>
                <ChipSelect v-model="auto.dark" :options="darkOptions" label="Tume teema" align="right" class="w-48"></ChipSelect>
            </div>
            <fieldset class="mt-1 grid gap-1.5">
                <legend class="mb-1 text-sm">Vaheta</legend>
                <label class="flex cursor-pointer items-center gap-2.5">
                    <input type="radio" class="radio radio-primary radio-sm" value="system" v-model="auto.source" />
                    <span class="text-sm">seadme heleda või tumeda režiimi järgi</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2.5">
                    <input type="radio" class="radio radio-primary radio-sm" value="sun" v-model="auto.source" />
                    <span class="text-sm">
                        päikesetõusu ja -loojangu järgi
                        <span class="block text-xs text-base-content/60">Tallinnas täna {{ hhmm(sun.rise) }} ja {{ hhmm(sun.set) }}</span>
                    </span>
                </label>
                <label class="flex items-center gap-2.5" :class="sensorSupported ? 'cursor-pointer' : 'opacity-50'">
                    <input type="radio" class="radio radio-primary radio-sm" value="sensor" v-model="auto.source" :disabled="!sensorSupported" />
                    <span class="text-sm">valgusanduri järgi</span>
                </label>
            </fieldset>
            <p v-if="!sensorSupported" class="text-xs text-base-content/60">See brauser ei anna valgusandurile ligi.</p>
            <p v-else-if="auto.source === 'sensor' && sensorError" class="text-xs text-error">{{ sensorError }}</p>
        </div>
        <template v-for="group in GROUPS" :key="group.name">
            <h4 class="col-span-full mt-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase">{{ group.name }}</h4>
            <!-- each tile is rendered in its own theme as a preview -->
            <button v-for="t in group.themes" :key="t.id" :data-theme="t.id" role="radio" :aria-checked="t.id === theme" @click="theme = t.id"
                class="rounded-box border-2 bg-base-100 p-2.5 text-left text-base-content"
                :class="t.id === theme ? 'border-primary' : 'border-base-300'">
                <div class="flex items-center justify-between gap-1 text-sm font-semibold">
                    {{ t.label }}
                    <span v-if="t.id === theme" class="text-primary" aria-hidden="true">✓</span>
                </div>
                <div class="mt-1.5 flex gap-1">
                    <span class="size-3.5 rounded-full bg-primary"></span>
                    <span class="size-3.5 rounded-full bg-secondary"></span>
                    <span class="size-3.5 rounded-full bg-accent"></span>
                    <span class="size-3.5 rounded-full bg-neutral"></span>
                </div>
            </button>
        </template>
    </div>
</template>
