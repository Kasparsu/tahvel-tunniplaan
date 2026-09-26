<script setup>
import { onMounted } from 'vue';
import DayChips from './components/DayChips.vue';
import DayWeekToggle from './components/DayWeekToggle.vue';
import Search from './components/Search.vue';
import WeekSelect from './components/WeekSelect.vue';
import LessonsGrid from './components/LessonsGrid.vue';
import Settings from './components/Settings.vue';
import { useTimetableStore } from './stores/timetable';

const store = useTimetableStore();
onMounted(store.init);
</script>
<template>
  <div class="mx-auto max-w-[900px] p-4">
    <header class="flex items-center gap-2.5">
      <div class="size-7 rounded-lg bg-linear-135 from-primary to-cyan-500" aria-hidden="true"></div>
      <h1 class="text-lg font-bold">Tunniplaan</h1>
      <Settings class="ml-auto"></Settings>
    </header>

    <div class="mt-3 grid grid-cols-[auto_auto] justify-between gap-2.5 md:grid-cols-[1fr_auto_auto] md:justify-stretch">
      <Search class="col-span-full md:col-span-1"></Search>
      <WeekSelect></WeekSelect>
      <DayWeekToggle></DayWeekToggle>
    </div>

    <DayChips></DayChips>
    <LessonsGrid></LessonsGrid>
    <div class="mt-2.5 rounded-box border border-dashed border-neutral p-3.5 text-center text-base-content/60" v-if="store.emptyMessage">
      {{ store.emptyMessage }}
    </div>

    <footer class="mt-6 mb-2 text-center text-xs text-base-content/60" v-if="store.index">
      Andmed: <a class="link link-secondary" :href="store.index.source" target="_blank" rel="noopener">Edupage</a>, uuendatud {{ store.updated }}
    </footer>
  </div>
</template>
