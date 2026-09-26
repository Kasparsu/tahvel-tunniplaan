<script setup>
import { ref, watch } from 'vue';
let {searchValue, options} = defineProps(['searchValue', 'options']);
let value = ref(searchValue);

// vue listen for searchValue changes
watch(() => searchValue, (newValue) => {
    value.value = newValue;
});
</script>
<template>
    <div class="relative">
        <label class="input w-full">
            <input v-model="value" @input="$emit('update', value)" type="text" class="text-base" placeholder="Otsi õpperühma või õpetajat…" autocomplete="off"
                aria-autocomplete="list" :aria-expanded="options.length > 0" />
            <button v-if="value" class="btn btn-ghost btn-xs btn-circle text-lg text-base-content/60" title="Puhasta" @click="$emit('clear')">×</button>
        </label>
        <ul v-if="options.length" class="menu absolute inset-x-0 top-full z-20 mt-1.5 max-h-75 w-full flex-nowrap overflow-y-auto rounded-box border border-neutral bg-base-100 p-1">
            <li v-for="option in options" :key="option.id">
                <button class="font-semibold" @click="$emit('selected', option)">{{ option.name }}</button>
            </li>
        </ul>
    </div>
</template>
