<script setup>
defineProps(['chips', 'day']);
</script>

<template>
    <div class="mt-3.5 flex gap-1.5 overflow-x-auto py-1" aria-label="Nädalapäevad">
        <button class="btn btn-sm h-9 rounded-full" :class="day === chip.day ? 'btn-primary btn-outline' : 'border-neutral bg-base-300'" v-for="chip in chips" :key="chip.day" @click="$emit('choose', chip.day)">
            <span class="w-5 text-center text-base">{{ chip.letter }}</span>
            <span class="font-medium opacity-60">{{ chip.date }}</span>
        </button>
    </div>
</template>
