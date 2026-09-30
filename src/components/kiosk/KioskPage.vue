<script setup>
import { ArrowLeft, House } from '@lucide/vue';
import { useRouter } from 'vue-router';

/** A kiosk page: its title, and big back and home buttons. */
defineProps({ title: { type: String, required: true }, sub: { type: String, default: '' } });
const router = useRouter();
</script>
<template>
    <div class="mt-4 flex items-center gap-3">
        <button type="button" class="btn btn-lg border-neutral" @click="router.back()"><ArrowLeft class="size-6" aria-hidden="true" />Tagasi</button>
        <div class="min-w-0 grow">
            <h2 class="truncate text-2xl font-bold">{{ title }}</h2>
            <p v-if="sub" class="text-base-content/60">{{ sub }}</p>
        </div>
        <RouterLink :to="{ name: 'kiosk' }" class="btn btn-lg border-neutral"><House class="size-6" aria-hidden="true" />Avaleht</RouterLink>
    </div>
    <div class="mt-4">
        <slot></slot>
    </div>
</template>
