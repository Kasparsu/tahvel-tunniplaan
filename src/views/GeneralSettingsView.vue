<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
</script>
<template>
  <h3 class="mb-2 text-sm font-semibold text-base-content/60">Kuvamine</h3>
  <div class="max-w-md">
    <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span>Näita vabu tunde</span>
      <input type="checkbox" class="toggle toggle-primary" v-model="store.settings.showFree" />
    </label>
    <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span>Peida päevad, kus tunde pole</span>
      <input type="checkbox" class="toggle toggle-primary" v-model="store.settings.hideEmptyDays" />
    </label>
  </div>
</template>
