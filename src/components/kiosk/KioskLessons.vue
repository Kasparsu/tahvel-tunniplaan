<script setup>
import { roomShort } from '../../codes';

/** Lessons as big cards, readable from a step away. `hide` leaves out what the page is already about. */
defineProps({
    lessons: { type: Array, required: true },
    hide: { type: Array, default: () => [] }, // any of 'time', 'group', 'room', 'teacher'
    dense: { type: Boolean, default: false }, // smaller cards, for lists of a whole campus
});
</script>
<template>
    <div class="grid" :class="dense ? 'gap-2' : 'gap-3'" :style="{ gridTemplateColumns: `repeat(auto-fill, minmax(${dense ? '14rem' : '17rem'}, 1fr))` }">
        <div v-for="(l, i) in lessons" :key="i" class="lesson rounded-box border border-base-300 bg-base-200" :class="dense ? 'p-2.5' : 'p-4'">
            <div v-if="!hide.includes('time')" class="font-bold tabular-nums" :class="dense ? 'text-base' : 'text-lg'">{{ l.start }} - {{ l.end }}</div>
            <div class="leading-tight font-semibold" :class="dense ? 'text-lg' : 'text-xl'">{{ l.subject }}</div>
            <div class="mt-1 grid gap-0.5 text-base-content/70" :class="dense ? 'text-sm' : 'text-base'">
                <span v-if="!hide.includes('group') && l.classes.length">{{ [...l.classes, ...l.groups].join(', ') }}</span>
                <span v-if="!hide.includes('room') && l.rooms.length">Ruum {{ l.rooms.map(roomShort).join(', ') }}</span>
                <span v-if="!hide.includes('teacher') && l.teachers.length">{{ l.teachers.join(', ') }}</span>
            </div>
        </div>
    </div>
</template>
