<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
</script>
<template>
    <div role="tablist" class="tabs tabs-box mt-3 w-fit">
        <button role="tab" class="tab" :class="{ 'tab-active': store.mode === 'timetable' }" @click="store.mode = 'timetable'">Tunniplaan</button>
        <button role="tab" class="tab" :class="{ 'tab-active': store.mode === 'rooms' }" @click="store.showFreeRooms()">Vabad ruumid</button>
    </div>
</template>
