<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ChipSelect from '../components/ChipSelect.vue';
import { useKioskStore } from '../stores/kiosk';
import { useTimetableStore } from '../stores/timetable';

const store = useTimetableStore();
const kiosk = useKioskStore();
const router = useRouter();
const campusOptions = computed(() => store.campuses.map((c) => ({ value: c.id, label: c.name })));
const kioskCampus = computed({ get: () => kiosk.settings.campus, set: (c) => (kiosk.settings.campus = c) });
function setKiosk(on) {
  kiosk.settings.enabled = on;
  if (on) router.push({ name: 'kiosk' });
}
</script>
<template>
  <div class="grid max-w-md gap-6">
    <section>
      <h3 class="mb-2 text-sm font-semibold text-base-content/60">Kuvamine</h3>
      <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
        <span>Näita vabu tunde</span>
        <input type="checkbox" class="toggle toggle-primary" v-model="store.settings.showFree" />
      </label>
      <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
        <span>Näita lõunat</span>
        <input type="checkbox" class="toggle toggle-primary" v-model="store.settings.showLunch" />
      </label>
      <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
        <span>Peida päevad, kus tunde pole</span>
        <input type="checkbox" class="toggle toggle-primary" v-model="store.settings.hideEmptyDays" />
      </label>
    </section>

    <section>
      <h3 class="mb-2 text-sm font-semibold text-base-content/60">Kioskirežiim</h3>
      <label class="flex cursor-pointer items-center justify-between gap-3 py-1.5">
        <span>Kioskirežiim</span>
        <input type="checkbox" class="toggle toggle-primary" :checked="kiosk.settings.enabled" @change="setKiosk($event.target.checked)" />
      </label>
      <div class="flex items-center justify-between gap-3 py-1.5">
        <span>Õppehoone</span>
        <ChipSelect v-model="kioskCampus" :options="campusOptions" label="Kioski õppehoone" class="w-40"></ChipSelect>
      </div>
      <p class="text-xs text-base-content/60">
        Puutetundliku ekraani vaade ühe õppehoone jaoks: suured paneelid, tänased tunnid ja valikud ilma klaviatuurita. Pärast 90 sekundit
        puudutamata naaseb see avalehele. Kioskirežiimis avanevad seaded logole 2 sekundit vajutades.
      </p>
    </section>
  </div>
</template>
