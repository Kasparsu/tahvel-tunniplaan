<script setup>
defineProps(['lessons']);
</script>
<template>
    <div class="mt-2.5 grid gap-2.5">
        <div class="grid grid-cols-[auto_auto_1fr] items-start gap-2.5 rounded-box border border-base-300 p-3 md:grid-cols-[30px_140px_1fr] max-[360px]:grid-cols-[30px_140px]"
            :class="lesson.isToday ? 'bg-today' : 'bg-base-200'" v-for="lesson in lessons">
            <div class="mt-0.5 size-8 rounded-lg bg-neutral text-center text-xl leading-8 font-bold">{{ lesson.day }}</div>
            <div class="font-bold tabular-nums">
                <div>{{ lesson.date }}</div>
                <div>{{ lesson.time.start }} - {{ lesson.time.end }}</div>
            </div>
            <div class="max-[360px]:col-span-full">
                <div class="text-[15px] font-bold md:text-base">{{ lesson.name }}</div>
                <div class="flex flex-wrap gap-x-1.5 text-[13px] text-base-content/60">
                    <span v-if="lesson.room">Ruum: {{ lesson.room }}</span>
                    <span v-if="lesson.showGroup && lesson.group">Rühm: {{ lesson.group }}</span>
                    <span v-if="!lesson.showGroup && lesson.teacher">Õpetaja: {{ lesson.teacher }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
