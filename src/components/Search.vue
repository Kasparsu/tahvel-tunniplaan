<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
</script>
<template>
    <div class="relative">
        <label class="input w-full">
            <input v-model="store.searchValue" @input="store.autocomplete(store.searchValue)" type="text" class="text-base" placeholder="Otsi õpperühma või õpetajat…" autocomplete="off"
                aria-autocomplete="list" :aria-expanded="store.options.length > 0" />
            <button v-if="store.searchValue" class="btn btn-ghost btn-xs btn-circle text-lg text-base-content/60" title="Puhasta" @click="store.clearSearch()">×</button>
        </label>
        <ul v-if="store.options.length" class="menu absolute inset-x-0 top-full z-20 mt-1.5 max-h-75 w-full flex-nowrap overflow-y-auto rounded-box border border-neutral bg-base-100 p-1">
            <li v-for="option in store.options" :key="option.id">
                <button class="font-semibold" @click="store.select(option)">{{ option.name }}</button>
            </li>
        </ul>
    </div>
</template>
