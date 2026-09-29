<script setup>
import { Monitor, Users } from '@lucide/vue';
import { EQUIPMENT, PLATFORMS, PLATFORM_SHORT } from '../roomFeatures';

/** A room's seats, computers and equipment as a row of icons, each with its name for tooltips and screen readers. */
const props = defineProps({ info: { type: Object, required: true } });
const equipment = EQUIPMENT.filter((e) => props.info.equipment.includes(e.id));
const platforms = props.info.platforms.map((p) => PLATFORM_SHORT[p] ?? p).join('/');
const platformNames = props.info.platforms.map((p) => PLATFORMS[p] ?? p).join(', ');
</script>
<template>
    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-base-content/70">
        <span class="inline-flex items-center gap-1" :title="`${info.seats} õpilaskohta`">
            <Users class="size-3.5" aria-hidden="true" />{{ info.seats }}<span class="sr-only"> õpilaskohta</span>
        </span>
        <span v-if="info.computers" class="inline-flex items-center gap-1" :title="`${info.computers} arvutit${platformNames ? ` (${platformNames})` : ''}`">
            <Monitor class="size-3.5" aria-hidden="true" />{{ info.computers }}<span v-if="platforms"> {{ platforms }}</span><span class="sr-only"> arvutit</span>
        </span>
        <span v-for="e in equipment" :key="e.id" class="inline-flex items-center gap-0.5" :title="e.label">
            <component :is="e.icon" class="size-3.5" aria-hidden="true" />
            <span v-if="e.id === 'television' && info.tvs">×{{ info.tvs }}</span>
            <span class="sr-only">{{ e.label }}</span>
        </span>
    </div>
</template>
