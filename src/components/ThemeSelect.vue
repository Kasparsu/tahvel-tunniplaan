<script setup>
import { ref, watch } from 'vue';

// daisyUI themes compiled in src/style.css; 'tunniplaan' is our own default
const THEMES = ['tunniplaan', 'techno', 'techno-dark', 'light', 'dark', 'dim', 'nord', 'cupcake', 'emerald', 'corporate', 'retro', 'synthwave', 'dracula', 'sunset', 'black'];
const STORAGE_KEY = 'tahvel.theme'; // also read by the inline script in index.html

const saved = localStorage.getItem(STORAGE_KEY);
const theme = ref(THEMES.includes(saved) ? saved : THEMES[0]);
const label = (t) => t[0].toUpperCase() + t.slice(1).replace('-', ' ');

watch(theme, (t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(STORAGE_KEY, t);
}, { immediate: true });
</script>
<template>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Teema">
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
