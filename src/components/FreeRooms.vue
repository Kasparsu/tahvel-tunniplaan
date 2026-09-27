<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ChipSelect from './ChipSelect.vue';
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
const router = useRouter();

/** A free room opens its timetable. */
function openRoom(name) {
    store.openRoom(name);
    router.push({ name: 'timetable' });
}

const campusOptions = computed(() => store.campuses.map((c) => ({ value: c.id, label: c.name })));
const periodOptions = computed(() => store.freePeriods.map((p) => ({ value: p.start, label: `${p.start} - ${p.end}` })));
const freeCampus = computed({ get: () => store.freeCampus, set: (c) => store.setFreeCampus(c) });
const freeSlot = computed({ get: () => store.freeSlot, set: (s) => (store.freeSlot = s) });
</script>
<template>
    <div class="mt-2.5">
        <div class="flex flex-wrap items-center gap-2">
            <ChipSelect v-model="freeCampus" :options="campusOptions" label="Õppehoone" class="grow sm:w-40 sm:grow-0"></ChipSelect>
            <!-- while looking at now, the closed select says so -->
            <ChipSelect v-model="freeSlot" :options="periodOptions" label="Tund" class="grow sm:w-44 sm:grow-0"
                :display="store.freeSlot === 'now' ? `Praegu (${store.freePeriod?.start})` : ''"></ChipSelect>
            <button class="btn btn-sm" :class="store.freeSlot === 'now' ? 'btn-primary' : 'border-neutral'" @click="store.showFreeNow()">Praegu</button>
        </div>

        <div v-if="store.freePeriod" class="mt-2.5 text-sm text-base-content/60">
            {{ store.freeRooms.length }} vaba ruumi,
            {{ store.freePeriod.now ? `praegu (${store.freePeriod.start})` : `${store.freePeriod.start} - ${store.freePeriod.end}` }}
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <!-- a free room opens its timetable -->
            <button v-for="r in store.freeRooms" :key="r.name" class="lesson rounded-box border border-base-300 bg-base-200 p-3 text-left" @click="openRoom(r.name)">
                <div class="font-bold">{{ r.name }}</div>
                <div class="text-[13px] text-base-content/60">{{ r.until ? `vaba kuni ${r.until}` : 'vaba päeva lõpuni' }}</div>
            </button>
        </div>
        <div v-if="store.weekData && (!store.freePeriod || !store.freeRooms.length)" class="mt-2.5 rounded-box border border-dashed border-neutral p-3.5 text-center text-base-content/60">
            {{ store.freePeriod ? 'Selles hoones pole sel ajal ühtki vaba ruumi.' : 'Selle hoone tunniaegu sel nädalal pole.' }}
        </div>
        <p class="mt-3 text-xs text-base-content/50">Tunniplaani järgi: muud broneeringud ja ruumid, kus tunde pole, siin ei kajastu.</p>
    </div>
</template>
