<script setup>
import { onMounted } from 'vue';
import DayChips from '../components/DayChips.vue';
import FreeRooms from '../components/FreeRooms.vue';
import NavTabs from '../components/NavTabs.vue';
import WeekSelect from '../components/WeekSelect.vue';
import { MODE_TABS } from './modeTabs';
import { useTimetableStore } from '../stores/timetable';

const store = useTimetableStore();
// opens on now: this week, today, the current period, the selection's campus
onMounted(() => store.showFreeRooms());
</script>
<template>
  <NavTabs :tabs="MODE_TABS" label="Vaade" class="mt-3"></NavTabs>
  <WeekSelect class="mt-3"></WeekSelect>
  <DayChips></DayChips>
  <FreeRooms></FreeRooms>
</template>
