<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
// active tab filled in the theme's primary colour, like the selected Nädal/Praegu buttons
const tab = (active) => (active ? 'tab-active bg-primary! text-primary-content!' : '');
</script>
<template>
    <div role="tablist" class="tabs tabs-box mt-3 w-fit border border-neutral">
        <button role="tab" class="tab" :class="tab(store.mode === 'timetable')" @click="store.mode = 'timetable'">Tunniplaan</button>
        <button role="tab" class="tab" :class="tab(store.mode === 'rooms')" @click="store.showFreeRooms()">Vabad ruumid</button>
    </div>
</template>
