<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import EDITOR_THEMES from '../themes/editor.json';

const label = (t) => t[0].toUpperCase() + t.slice(1).replace('-', ' ');
// daisyUI's built-in themes enabled in src/style.css
const DAISY_THEMES = ['light', 'dark', 'dim', 'cupcake', 'emerald', 'corporate', 'retro', 'synthwave', 'dracula', 'sunset', 'black'];
const GROUPS = [
    { name: 'Tunniplaan', themes: ['techno', 'techno-dark', 'tunniplaan'].map((id) => ({ id, label: label(id) })) },
    { name: 'Koodiredaktorid', themes: EDITOR_THEMES },
    { name: 'daisyUI', themes: DAISY_THEMES.map((id) => ({ id, label: label(id) })) },
];
const THEMES = GROUPS.flatMap((g) => g.themes.map((t) => t.id));
// Default: follow the device's light/dark preference with the Techno pair
const AUTO = 'auto';
const AUTO_LIGHT = 'techno';
const AUTO_DARK = 'techno-dark';
const STORAGE_KEY = 'tahvel.theme'; // also read by the inline script in index.html; absent means AUTO

const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const prefersDark = ref(darkQuery.matches);
const onSchemeChange = (e) => (prefersDark.value = e.matches);
darkQuery.addEventListener('change', onSchemeChange);
onUnmounted(() => darkQuery.removeEventListener('change', onSchemeChange));

const saved = localStorage.getItem(STORAGE_KEY);
if (saved && !THEMES.includes(saved)) localStorage.removeItem(STORAGE_KEY); // a theme that has since been removed
const theme = ref(THEMES.includes(saved) ? saved : AUTO);
const applied = computed(() => (theme.value === AUTO ? (prefersDark.value ? AUTO_DARK : AUTO_LIGHT) : theme.value));

watch(applied, (t) => {
    document.documentElement.dataset.theme = t;
    // match the browser/OS bar (installed app, mobile address bar) to the theme's background
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim();
    if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}, { immediate: true });
watch(theme, (t) => (t === AUTO ? localStorage.removeItem(STORAGE_KEY) : localStorage.setItem(STORAGE_KEY, t)));
</script>
<template>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Teema">
        <button :data-theme="theme === AUTO ? applied : AUTO_LIGHT" role="radio" :aria-checked="theme === AUTO" @click="theme = AUTO"
            class="col-span-full rounded-box border-2 bg-base-100 p-2.5 text-left text-base-content"
            :class="theme === AUTO ? 'border-primary' : 'border-base-300'">
            <div class="flex items-center justify-between text-sm font-semibold">
                Automaatne
                <span v-if="theme === AUTO" class="text-primary" aria-hidden="true">✓</span>
            </div>
            <div class="mt-0.5 text-xs opacity-60">{{ label(AUTO_LIGHT) }} või {{ label(AUTO_DARK) }}, vastavalt seadme seadistusele</div>
            <div class="mt-1.5 flex gap-1">
                <!-- dots take their colours from each theme of the pair -->
                <span :data-theme="AUTO_LIGHT" class="size-3.5 rounded-full bg-primary"></span>
                <span :data-theme="AUTO_LIGHT" class="size-3.5 rounded-full bg-secondary"></span>
                <span :data-theme="AUTO_DARK" class="size-3.5 rounded-full bg-primary"></span>
                <span :data-theme="AUTO_DARK" class="size-3.5 rounded-full bg-base-100 ring-1 ring-base-content/20"></span>
            </div>
        </button>
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
