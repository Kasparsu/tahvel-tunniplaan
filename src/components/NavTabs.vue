<script setup>
defineProps({
    tabs: { type: Array, required: true }, // [{ to, label }]
    label: { type: String, required: true },
});
</script>
<template>
    <!-- bordered like the chips; the current page's tab filled in the theme's primary colour, like the selected Nädal button -->
    <nav class="tabs tabs-box w-fit border border-neutral" :aria-label="label">
        <RouterLink v-for="t in tabs" :key="t.label" :to="t.to" class="tab" exact-active-class="tab-active bg-primary! text-primary-content!">
            {{ t.label }}
        </RouterLink>
    </nav>
</template>
