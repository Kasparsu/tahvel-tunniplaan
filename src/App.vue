<script setup>
import { onMounted } from 'vue';
import DayChips from './components/DayChips.vue';
import DayWeekToggle from './components/DayWeekToggle.vue';
import Search from './components/Search.vue';
import WeekSelect from './components/WeekSelect.vue';
import LessonsGrid from './components/LessonsGrid.vue';
import ModeTabs from './components/ModeTabs.vue';
import FreeRooms from './components/FreeRooms.vue';
import Settings from './components/Settings.vue';
import TechnoLogo from './components/TechnoLogo.vue';
import { useTimetableStore } from './stores/timetable';

const store = useTimetableStore();
onMounted(store.init);
</script>
<template>
  <div class="mx-auto max-w-[900px] p-4">
    <header class="flex items-center gap-2.5">
      <TechnoLogo class="h-7 w-auto text-primary"></TechnoLogo>
      <div class="h-6 w-px bg-base-content/20" aria-hidden="true"></div>
      <h1 class="text-lg font-bold">Tunniplaan</h1>
      <Settings class="ml-auto"></Settings>
    </header>

    <ModeTabs></ModeTabs>

    <div v-if="store.mode === 'timetable'" class="mt-3 grid grid-cols-[auto_auto] justify-between gap-2.5 md:grid-cols-[1fr_auto_auto] md:justify-stretch">
      <Search class="col-span-full md:col-span-1"></Search>
      <WeekSelect></WeekSelect>
      <DayWeekToggle></DayWeekToggle>
    </div>
    <WeekSelect v-else class="mt-3"></WeekSelect>

    <DayChips></DayChips>
    <template v-if="store.mode === 'timetable'">
      <LessonsGrid></LessonsGrid>
      <div class="mt-2.5 rounded-box border border-dashed border-neutral p-3.5 text-center text-base-content/60" v-if="store.emptyMessage">
        {{ store.emptyMessage }}
      </div>
    </template>
    <FreeRooms v-else></FreeRooms>

    <footer class="mt-6 mb-2 text-center text-xs text-base-content/60" v-if="store.index">
      Andmed:
      <template v-for="(s, i) in store.sources" :key="s.id">{{ i ? ', ' : '' }}<a class="link link-secondary" :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a></template>;
      uuendatud {{ store.updated }}
    </footer>
  </div>
</template>
