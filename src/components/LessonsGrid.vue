<script setup>
import { useTimetableStore } from '../stores/timetable';
const store = useTimetableStore();
</script>
<template>
    <div class="mt-2.5 grid gap-2.5">
        <template v-for="(lesson, i) in store.lessons">
            <div v-if="store.displayType === 'week' && lesson.day !== store.lessons[i - 1]?.day" class="divider divider-primary my-1 text-sm font-semibold">
                {{ lesson.dayName }}
            </div>
            <div class="grid grid-cols-[auto_auto_1fr] items-start gap-2.5 rounded-box border p-3 md:grid-cols-[30px_140px_1fr] max-[360px]:grid-cols-[30px_140px]"
                :class="lesson.free ? 'border-dashed border-neutral text-base-content/60' : ['lesson border-base-300', lesson.isToday ? 'bg-today' : 'bg-base-200']">
                <div class="letter mt-0.5 size-8 rounded-lg text-center text-xl leading-8 font-bold" :class="lesson.free ? 'bg-neutral/40 text-neutral-content/70' : 'bg-neutral text-neutral-content'">{{ lesson.day }}</div>
                <div class="font-bold whitespace-nowrap tabular-nums">
                    <div>{{ lesson.date }}</div>
                    <div>{{ lesson.time.start }} - {{ lesson.time.end }}</div>
                </div>
                <div v-if="lesson.free" class="self-center text-[15px] md:text-base">Vaba</div>
                <div v-else class="max-[360px]:col-span-full">
                    <div class="text-[15px] font-bold md:text-base">{{ lesson.name }}</div>
                    <div class="flex flex-wrap gap-x-1.5 text-[13px] text-base-content/60">
                        <span v-if="lesson.campus" class="font-semibold text-base-content/80">{{ lesson.campus }}</span>
                        <span v-if="lesson.showRoom && lesson.room">Ruum: {{ lesson.room }}</span>
                        <span v-if="lesson.showGroup && lesson.group">Rühm: {{ lesson.group }}</span>
                        <span v-if="lesson.showTeacher && lesson.teacher">Õpetaja: {{ lesson.teacher }}</span>
                        <span v-if="lesson.note" class="basis-full italic">{{ lesson.note }}</span>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
