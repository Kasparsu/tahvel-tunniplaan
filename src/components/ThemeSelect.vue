<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';

// daisyUI themes compiled in src/style.css
const THEMES = ['techno', 'techno-dark', 'tunniplaan', 'light', 'dark', 'dim', 'nord', 'cupcake', 'emerald', 'corporate', 'retro', 'synthwave', 'dracula', 'sunset', 'black'];
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
const theme = ref(THEMES.includes(saved) ? saved : AUTO);
const applied = computed(() => (theme.value === AUTO ? (prefersDark.value ? AUTO_DARK : AUTO_LIGHT) : theme.value));
const label = (t) => t[0].toUpperCase() + t.slice(1).replace('-', ' ');

watch(applied, (t) => (document.documentElement.dataset.theme = t), { immediate: true });
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
        <!-- each tile is rendered in its own theme as a preview -->
        <button v-for="t in THEMES" :key="t" :data-theme="t" role="radio" :aria-checked="t === theme" @click="theme = t"
            class="rounded-box border-2 bg-base-100 p-2.5 text-left text-base-content"
            :class="t === theme ? 'border-primary' : 'border-base-300'">
            <div class="flex items-center justify-between text-sm font-semibold">
                {{ label(t) }}
                <span v-if="t === theme" class="text-primary" aria-hidden="true">✓</span>
            </div>
            <div class="mt-1.5 flex gap-1">
                <span class="size-3.5 rounded-full bg-primary"></span>
                <span class="size-3.5 rounded-full bg-secondary"></span>
                <span class="size-3.5 rounded-full bg-accent"></span>
                <span class="size-3.5 rounded-full bg-neutral"></span>
            </div>
        </button>
    </div>
</template>
