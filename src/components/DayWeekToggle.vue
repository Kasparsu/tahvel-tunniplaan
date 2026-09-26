<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
</script>
<template>
    <div class="flex gap-2">
        <button class="btn" :class="store.showingToday ? 'btn-primary' : 'border-neutral'" @click="store.toggle('today')">Täna</button>
        <button class="btn" :class="store.displayType==='week' ? 'btn-primary' : 'border-neutral'" @click="store.toggle('week')">Nädal</button>
    </div>
</template>
