<script setup>
defineProps(['lessons']);
</script>
<template>
    <div class="grid" id="lessons">
        <div class="lesson" :class="{'today': lesson.isToday}" v-for="lesson in lessons">
            <div class="weekday">{{ lesson.day }}</div>
            <div class="time">
                <div>{{ lesson.date }}</div>
                <div>{{ lesson.time.start }} - {{ lesson.time.end }}</div>
            </div>
            <div>
                <div class="subject">{{ lesson.name }}</div>
                <div class="meta">
                    <span v-if="lesson.room">Ruum: {{ lesson.room }}</span>
                    <span v-if="lesson.showGroup && lesson.group">Rühm: {{ lesson.group }}</span>
                    <span v-if="!lesson.showGroup && lesson.teacher">Õpetaja: {{ lesson.teacher }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
