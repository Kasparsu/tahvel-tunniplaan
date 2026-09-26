<script setup>
defineProps(['range', 'current', 'hasPrev', 'hasNext']);
</script>
<template>
    <div class="flex items-center gap-1.5 text-sm whitespace-nowrap text-base-content/60">
        <button class="btn btn-circle btn-ghost btn-sm" :disabled="!hasPrev" @click="$emit('shift', -1)" aria-label="Eelmine nädal">‹</button>
        <span :class="{ 'font-semibold text-base-content': current }">{{ range }}</span>
        <button class="btn btn-circle btn-ghost btn-sm" :disabled="!hasNext" @click="$emit('shift', 1)" aria-label="Järgmine nädal">›</button>
    </div>
</template>
