<script setup>
import { storeToRefs } from 'pinia';
import ChipSelect from './ChipSelect.vue';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();
const { GROUPS, BY_ID, AUTO, lightOptions, darkOptions, sensorSupported, hhmm } = themeStore;
const { theme, auto, applied, sensorError, sun } = storeToRefs(themeStore);
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
