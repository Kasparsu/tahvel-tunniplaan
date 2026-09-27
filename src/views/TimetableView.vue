<script setup>
import { onMounted } from 'vue';
import DayChips from '../components/DayChips.vue';
import DayWeekToggle from '../components/DayWeekToggle.vue';
import LessonsGrid from '../components/LessonsGrid.vue';
import NavTabs from '../components/NavTabs.vue';
import Search from '../components/Search.vue';
import WeekSelect from '../components/WeekSelect.vue';
import { MODE_TABS } from './modeTabs';
import { useTimetableStore } from '../stores/timetable';

const store = useTimetableStore();
onMounted(() => (store.mode = 'timetable'));
</script>
<template>
  <NavTabs :tabs="MODE_TABS" label="Vaade" class="mt-3"></NavTabs>

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
</template>
