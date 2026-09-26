<script setup>
defineProps(['current']);
</script>
<template>
    <div class="flex gap-2">
        <button class="btn" :class="current==='today' ? 'btn-primary' : 'border-neutral'" @click="$emit('toggle', 'today')">Täna</button>
        <button class="btn" :class="current==='week' ? 'btn-primary' : 'border-neutral'" @click="$emit('toggle', 'week')">Nädal</button>
    </div>
</template>
